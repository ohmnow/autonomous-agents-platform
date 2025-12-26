import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import {
  checkRateLimit,
  rateLimits,
  rateLimitExceededResponse,
  createRateLimitHeaders,
} from '@/lib/rate-limit';
import { startBuildInBackground, stopBuild } from '@/lib/sandbox/build-runner';
import {
  getBuildById,
  createBuild,
  updateBuild,
  countBuilds,
  type ComplexityTier,
} from '@repo/database';
import type { BuildStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Max concurrent builds per user (keep in sync with /api/builds)
const MAX_CONCURRENT_BUILDS = 5;

// Extract app name from spec (supports both XML and Markdown formats)
function extractAppName(spec: string): string {
  const xmlMatch = spec.match(/<project_name>\s*([^<]+)\s*<\/project_name>/);
  if (xmlMatch) return xmlMatch[1].trim();
  const mdMatch = spec.match(/^#\s+(.+)$/m);
  if (mdMatch) return mdMatch[1].trim();
  return 'Untitled Build';
}

/**
 * POST /api/builds/[id]/restart
 * Restart a build by cloning its inputs into a new build and starting it.
 * If the original build is RUNNING, it will be stopped first.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Rate limiting: reuse builds limit (restart creates a new build)
    const rateLimit = checkRateLimit(`builds:${userId}`, rateLimits.builds);
    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    const existing = await getBuildById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If build is running, stop it first and mark cancelled
    if (existing.status === 'RUNNING') {
      await stopBuild(existing.id);
      await updateBuild(existing.id, { status: 'CANCELLED' as BuildStatus });
    }

    // Check concurrent builds limit
    const runningBuilds = await countBuilds({ userId, status: 'RUNNING' });
    if (runningBuilds >= MAX_CONCURRENT_BUILDS) {
      return NextResponse.json(
        {
          error: 'concurrent_build_limit',
          message: `You have ${runningBuilds} builds running. Maximum concurrent builds is ${MAX_CONCURRENT_BUILDS}. Please wait for one to complete.`,
        },
        { status: 429 }
      );
    }

    const featureCount = existing.targetFeatureCount ?? 80;

    // Create new build (clone)
    let build = await createBuild({
      userId,
      projectId: existing.projectId ?? undefined,
      appSpecId: existing.appSpecId ?? undefined,
      appSpec: existing.appSpec,
      harnessId: existing.harnessId,
      sandboxProvider: existing.sandboxProvider,
      complexityTier: existing.complexityTier as ComplexityTier,
      targetFeatureCount: featureCount,
      complexityInferred: existing.complexityInferred,
    });

    // Mark running and initialize progress
    build = await updateBuild(build.id, {
      status: 'RUNNING' as BuildStatus,
      progress: { completed: 0, total: featureCount },
    });

    // Start build async
    startBuildInBackground(build.id, build.appSpec, build.sandboxProvider, build.harnessId, featureCount).catch(
      (error) => console.error('Restarted build background process error:', error)
    );

    return NextResponse.json(
      {
        build: {
          ...build,
          name: extractAppName(build.appSpec),
          progress: build.progress || { completed: 0, total: featureCount },
          restartedFromBuildId: existing.id,
        },
      },
      {
        status: 201,
        headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error restarting build:', error);
    return NextResponse.json({ error: 'Failed to restart build' }, { status: 500 });
  }
}




