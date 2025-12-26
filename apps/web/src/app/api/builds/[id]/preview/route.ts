import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { getBuildById, updateBuild } from '@repo/database';
import { E2BProvider } from '@repo/sandbox-providers';
import {
  startPreview,
  stopPreview,
  getPreviewStatus,
  extendPreviewTTL,
  isSandboxAlive,
} from '@/lib/sandbox/preview-manager';
import { restoreArtifactsToSandbox } from '@/lib/sandbox/artifact-storage';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// E2B Provider instance
const e2bProvider = new E2BProvider();

/**
 * GET /api/builds/[id]/preview
 * Get the current preview status for a build
 */
export async function GET(request: Request, { params }: RouteParams) {
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

    const preview = await getPreviewStatus(id);

    if (!preview) {
      return NextResponse.json({
        preview: null,
        message: 'No active preview for this build',
      });
    }

    return NextResponse.json({
      preview: {
        ...preview,
        expiresAt: preview.expiresAt.toISOString(),
        startedAt: preview.startedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error getting preview status:', error);
    return NextResponse.json(
      { error: 'Failed to get preview status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/builds/[id]/preview
 * Start a preview for a completed build
 * 
 * Request body:
 * - ttlMinutes?: number - Time-to-live in minutes (default: 60, max: 1440)
 * - port?: number - Port to run the preview on (default: auto-detect)
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

    // Check if build is completed
    if (build.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot start preview for non-completed build' },
        { status: 400 }
      );
    }

    // Check if preview already running - WITH sandbox verification
    // This actually pings the sandbox to ensure it's alive, not just trusting DB state
    const existingPreview = await getPreviewStatus(id, { verifySandbox: true });
    if (existingPreview && existingPreview.status === 'running') {
      return NextResponse.json({
        preview: {
          ...existingPreview,
          expiresAt: existingPreview.expiresAt.toISOString(),
          startedAt: existingPreview.startedAt.toISOString(),
        },
        message: 'Preview already running',
      });
    }
    // If we get here, either no preview exists OR the sandbox was dead and marked expired
    // In either case, we need to create a fresh sandbox

    // Check if artifacts are available
    if (!build.artifactKey) {
      return NextResponse.json(
        {
          error: 'No artifacts available',
          message: 'This build does not have saved artifacts. Cannot start preview.',
        },
        { status: 400 }
      );
    }

    // Parse request body
    let ttlMinutes = 60;
    let port: number | undefined;
    
    try {
      const body = await request.json();
      ttlMinutes = Math.min(body.ttlMinutes || 60, 1440); // Max 24 hours
      port = body.port;
    } catch {
      // No body or invalid JSON, use defaults
    }

    const ttlMs = ttlMinutes * 60 * 1000;

    // E2B hobby tier has 1 hour max timeout (3600 seconds)
    // E2B pro tier has 24 hour max timeout (86400 seconds)
    const MAX_SANDBOX_TIMEOUT_SECONDS = 3600; // 1 hour for hobby tier
    const timeoutSeconds = Math.min(
      Math.ceil(ttlMs / 1000),
      MAX_SANDBOX_TIMEOUT_SECONDS
    );

    // Create a new sandbox for preview
    const sandbox = await e2bProvider.create({
      template: 'base',
      timeout: timeoutSeconds,
      env: {},
    });

    try {
      // Try to reconnect to existing sandbox if it's still alive
      if (build.sandboxId) {
        console.log(`[preview] Attempting to reconnect to existing sandbox ${build.sandboxId}`);
        try {
          const existingSandbox = await e2bProvider.get(build.sandboxId);
          if (existingSandbox) {
            // Verify sandbox is actually responsive
            const alive = await isSandboxAlive(existingSandbox);
            if (alive) {
              // Use existing sandbox, destroy the new one we created
              console.log(`[preview] Reconnected to existing sandbox ${build.sandboxId}`);
              await sandbox.destroy();
              
              const preview = await startPreview(id, existingSandbox, {
                port,
                ttlMs,
              });

              return NextResponse.json(
                {
                  preview: {
                    ...preview,
                    expiresAt: preview.expiresAt.toISOString(),
                    startedAt: preview.startedAt.toISOString(),
                  },
                  message: 'Preview started successfully (reconnected)',
                },
                { status: 201 }
              );
            } else {
              console.log(`[preview] Existing sandbox ${build.sandboxId} is not responsive, will use fresh sandbox`);
            }
          }
        } catch (reconnectError) {
          console.log(`[preview] Could not reconnect to sandbox: ${reconnectError}`);
          // Continue to restore from artifacts with fresh sandbox
        }
      }

      // Restore from artifacts - create fresh sandbox and extract saved files
      console.log(`[preview] Restoring build ${id} from artifacts to new sandbox ${sandbox.id}`);
      
      try {
        await restoreArtifactsToSandbox(id, sandbox, '/home/user');
        console.log(`[preview] Artifacts restored successfully`);
        
        // Start preview with the restored sandbox
        const preview = await startPreview(id, sandbox, {
          port,
          ttlMs,
        });

        return NextResponse.json(
          {
            preview: {
              ...preview,
              expiresAt: preview.expiresAt.toISOString(),
              startedAt: preview.startedAt.toISOString(),
            },
            message: 'Preview started from artifacts',
            restoredFromArtifacts: true,
          },
          { status: 201 }
        );
      } catch (restoreError) {
        console.error(`[preview] Failed to restore from artifacts:`, restoreError);
        await sandbox.destroy();
        return NextResponse.json(
          {
            error: 'Failed to restore artifacts',
            message: restoreError instanceof Error ? restoreError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    } catch (error) {
      // Clean up sandbox on error
      try {
        await sandbox.destroy();
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error starting preview:', error);
    return NextResponse.json(
      { error: 'Failed to start preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/builds/[id]/preview
 * Extend preview TTL
 * 
 * Request body:
 * - additionalMinutes?: number - Additional time in minutes (default: 60, max: 1440)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
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

    // Check if preview is running
    const preview = await getPreviewStatus(id);
    if (!preview || preview.status !== 'running') {
      return NextResponse.json(
        { error: 'No active preview to extend' },
        { status: 400 }
      );
    }

    // Parse request body
    let additionalMinutes = 60;
    try {
      const body = await request.json();
      additionalMinutes = Math.min(body.additionalMinutes || 60, 1440);
    } catch {
      // Use default
    }

    // Get sandbox
    if (!build.sandboxId) {
      return NextResponse.json(
        { error: 'Sandbox not found' },
        { status: 400 }
      );
    }

    const sandbox = await e2bProvider.get(build.sandboxId);
    if (!sandbox) {
      // Mark as expired
      await updateBuild(id, {
        previewStatus: 'expired',
      });
      return NextResponse.json(
        { error: 'Sandbox no longer available' },
        { status: 400 }
      );
    }

    const newExpiry = await extendPreviewTTL(id, sandbox, additionalMinutes * 60 * 1000);

    return NextResponse.json({
      preview: {
        ...preview,
        expiresAt: newExpiry.toISOString(),
        startedAt: preview.startedAt.toISOString(),
      },
      message: `Preview extended by ${additionalMinutes} minutes`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error extending preview:', error);
    return NextResponse.json(
      { error: 'Failed to extend preview' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/builds/[id]/preview
 * Stop a running preview
 */
export async function DELETE(request: Request, { params }: RouteParams) {
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

    // Check if preview is running
    const preview = await getPreviewStatus(id);
    if (!preview) {
      return NextResponse.json({
        message: 'No active preview to stop',
      });
    }

    // Get sandbox and stop preview
    if (build.sandboxId) {
      const sandbox = await e2bProvider.get(build.sandboxId);
      if (sandbox) {
        await stopPreview(id, sandbox);
      } else {
        // Sandbox already gone, just update DB
        await updateBuild(id, {
          sandboxId: undefined,
          outputUrl: undefined,
          previewStatus: 'stopped',
          previewExpiresAt: undefined,
        });
      }
    }

    return NextResponse.json({
      message: 'Preview stopped successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error stopping preview:', error);
    return NextResponse.json(
      { error: 'Failed to stop preview' },
      { status: 500 }
    );
  }
}

