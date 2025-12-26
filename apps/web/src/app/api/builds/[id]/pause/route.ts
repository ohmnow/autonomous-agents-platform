import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { getBuildById, pauseBuild } from '@repo/database';
import { pauseBuildExecution, getCheckpointData } from '@/lib/sandbox/build-runner';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/builds/[id]/pause
 * Pause a running build, saving its current state for later resumption.
 * 
 * Request body (optional):
 * - reason?: string - Reason for pausing the build
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    const build = await getBuildById(id);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (build.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can only pause running builds
    if (build.status !== 'RUNNING') {
      return NextResponse.json(
        { error: 'Can only pause running builds', currentStatus: build.status },
        { status: 400 }
      );
    }

    // Parse optional reason from request body
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // No body or invalid JSON, that's fine
    }

    // Signal the build runner to pause and save checkpoint
    const pauseResult = await pauseBuildExecution(id);

    if (!pauseResult.success) {
      return NextResponse.json(
        { error: 'Failed to pause build', details: pauseResult.error },
        { status: 500 }
      );
    }

    // Get checkpoint data from the paused build
    const checkpoint = getCheckpointData(id);

    // Update database with paused state
    const updatedBuild = await pauseBuild(id, {
      reason,
      checkpointData: checkpoint?.checkpointData,
      conversationHistory: checkpoint?.conversationHistory ?? undefined,
      artifactKey: pauseResult.artifactKey,
    });

    return NextResponse.json({
      build: {
        id: updatedBuild.id,
        status: updatedBuild.status,
        pausedAt: updatedBuild.pausedAt?.toISOString(),
        pauseReason: updatedBuild.pauseReason,
        progress: updatedBuild.progress,
        hasCheckpoint: !!checkpoint,
      },
      message: 'Build paused successfully. You can resume it later.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error pausing build:', error);
    return NextResponse.json(
      { error: 'Failed to pause build', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

