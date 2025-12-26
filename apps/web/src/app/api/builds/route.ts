import { NextResponse } from 'next/server';
import { startBuildInBackground } from '@/lib/sandbox/build-runner';
import { ensureUser } from '@/lib/auth';
import {
  checkRateLimit,
  rateLimits,
  rateLimitExceededResponse,
  createRateLimitHeaders,
} from '@/lib/rate-limit';
import {
  createBuild,
  listBuilds,
  updateBuild,
  countBuilds,
  getDefaultFeatureCount,
  type ComplexityTier,
} from '@repo/database';
import type { Build, BuildStatus } from '@prisma/client';

// Max concurrent builds per user
const MAX_CONCURRENT_BUILDS = 5;

// Max spec size (100KB)
const MAX_SPEC_SIZE = 100 * 1024;

// Extract app name from spec (supports both XML and Markdown formats)
function extractAppName(spec: string): string {
  // Try XML format first: <project_name>...</project_name>
  const xmlMatch = spec.match(/<project_name>\s*([^<]+)\s*<\/project_name>/);
  if (xmlMatch) {
    return xmlMatch[1].trim();
  }
  
  // Fall back to markdown title: # App Name
  const mdMatch = spec.match(/^#\s+(.+)$/m);
  if (mdMatch) {
    return mdMatch[1].trim();
  }
  return 'Untitled Build';
}

/**
 * GET /api/builds
 * List all builds for the current user
 */
export async function GET() {
  try {
    const { userId } = await ensureUser();
    const builds = await listBuilds({ userId, limit: 50 });
    
    return NextResponse.json({
      builds: builds.map((b: Build) => ({
        ...b,
        name: extractAppName(b.appSpec),
        progress: b.progress || { completed: 0, total: 0 },
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error listing builds:', error);
    return NextResponse.json({ error: 'Failed to list builds' }, { status: 500 });
  }
}

/**
 * POST /api/builds
 * Create a new build
 */
export async function POST(request: Request) {
  try {
    const { userId } = await ensureUser();

    // Rate limiting: 10 builds per hour
    const rateLimit = checkRateLimit(`builds:${userId}`, rateLimits.builds);
    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    const body = await request.json();
    const { 
      appSpec, 
      projectId, 
      appSpecId, 
      sandboxProvider = 'e2b', 
      harnessId = 'coding',
      complexityTier = 'standard',
      targetFeatureCount,
      complexityInferred = true,
      reviewGatesEnabled = false,
    } = body as {
      appSpec: string;
      projectId?: string;
      appSpecId?: string;
      sandboxProvider?: string;
      harnessId?: string;
      complexityTier?: ComplexityTier;
      targetFeatureCount?: number;
      complexityInferred?: boolean;
      reviewGatesEnabled?: boolean;
    };

    if (!appSpec) {
      return NextResponse.json(
        { error: 'appSpec is required' },
        { status: 400 }
      );
    }

    // Validate spec size
    if (appSpec.length > MAX_SPEC_SIZE) {
      return NextResponse.json(
        {
          error: 'spec_too_large',
          message: `Specification is too large. Maximum size is ${MAX_SPEC_SIZE / 1024}KB.`,
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

    // Determine feature count - use provided value, or default based on tier
    const featureCount = targetFeatureCount ?? getDefaultFeatureCount(complexityTier);

    // Create build in database
    let build = await createBuild({
      userId,
      projectId,
      appSpecId,
      appSpec,
      harnessId,
      sandboxProvider,
      complexityTier,
      targetFeatureCount: featureCount,
      complexityInferred,
      reviewGatesEnabled,
    });

    // Update with initial progress and status
    // Start with total: 0 - the actual feature count will be set once feature_list.json is generated
    build = await updateBuild(build.id, {
      status: 'RUNNING' as BuildStatus,
      progress: { completed: 0, total: 0 },
    });

    // Start the build in background (don't await)
    // Note: startBuildInBackground handles its own completion via completeBuild()
    // which properly sets artifactKey. We only need to catch errors here for logging.
    startBuildInBackground(build.id, appSpec, sandboxProvider, harnessId, featureCount, reviewGatesEnabled)
      .catch(async (error) => {
        // startBuildInBackground already handles status updates internally,
        // but log any unhandled errors for debugging
        console.error('Build background process error:', error);
      });

    return NextResponse.json(
      {
        build: {
          ...build,
          name: extractAppName(appSpec),
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
    console.error('Error creating build:', error);
    return NextResponse.json(
      { error: 'Failed to create build' },
      { status: 500 }
    );
  }
}
