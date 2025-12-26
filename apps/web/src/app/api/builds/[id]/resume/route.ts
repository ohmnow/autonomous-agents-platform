import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import {
  checkRateLimit,
  rateLimits,
  rateLimitExceededResponse,
  createRateLimitHeaders,
} from '@/lib/rate-limit';
import { getBuildById, resumeBuild, countBuilds } from '@repo/database';
import { resumeBuildFromCheckpoint } from '@/lib/sandbox/build-runner';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Max concurrent builds per user
const MAX_CONCURRENT_BUILDS = 5;

/**
 * POST /api/builds/[id]/resume
 * Resume a paused or failed build from its last checkpoint.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Rate limiting
    const rateLimit = checkRateLimit(`builds:${userId}`, rateLimits.builds);
    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    const build = await getBuildById(id);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (build.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can resume paused, failed, or cancelled builds (if they have artifacts)
    const canResume = build.status === 'PAUSED' || build.status === 'FAILED' || 
      (build.status === 'CANCELLED' && build.artifactKey);
    
    if (!canResume) {
      return NextResponse.json(
        { 
          error: 'Cannot resume this build',
          currentStatus: build.status,
          hint: build.status === 'RUNNING' 
            ? 'This build is already running' 
            : build.status === 'CANCELLED' && !build.artifactKey
            ? 'No artifacts saved - use restart to start fresh'
            : 'Use restart to start a fresh build'
        },
        { status: 400 }
      );
    }

    // We only need artifacts to resume - the feature_list.json inside tells us progress
    if (!build.artifactKey) {
      return NextResponse.json(
        { 
          error: 'No artifacts available',
          message: 'This build cannot be resumed because no artifacts were saved. Use restart to start fresh.',
        },
        { status: 400 }
      );
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

    // Update build status to running
    const updatedBuild = await resumeBuild(id);

    // Start the build from checkpoint in background
    resumeBuildFromCheckpoint(
      id,
      build.appSpec,
      build.sandboxProvider,
      build.harnessId,
      build.targetFeatureCount,
      {
        checkpointData: build.checkpointData as Record<string, unknown> | null,
        conversationHistory: build.conversationHistory as Array<unknown> | null,
        artifactKey: build.artifactKey,
      }
    ).catch((error) => {
      console.error('Resume build background process error:', error);
    });

    return NextResponse.json(
      {
        build: {
          id: updatedBuild.id,
          status: updatedBuild.status,
          progress: updatedBuild.progress,
          resumedFrom: {
            previousStatus: build.status,
            pausedAt: build.pausedAt?.toISOString(),
            pauseReason: build.pauseReason,
          },
        },
        message: 'Build resumed from checkpoint',
      },
      {
        status: 200,
        headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error resuming build:', error);
    return NextResponse.json(
      { error: 'Failed to resume build', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

