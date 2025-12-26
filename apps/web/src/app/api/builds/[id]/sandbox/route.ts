/**
 * Sandbox Status API
 * 
 * GET /api/builds/[id]/sandbox
 * Returns the current status of the E2B sandbox for a build, including:
 * - Whether the sandbox is running
 * - Key files (feature_list.json, DESIGN.md, etc.)
 * - File system info
 */

import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { getBuildById } from '@repo/database';
import { e2bProvider } from '@repo/sandbox-providers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface FeatureListItem {
  category: string;
  description: string;
  steps: string[];
  passes: boolean;
  blocking?: boolean;
}

/**
 * GET /api/builds/[id]/sandbox
 * Get sandbox status and key files
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

    // Check if build has a sandbox ID
    if (!build.sandboxId) {
      return NextResponse.json({
        status: 'no_sandbox',
        message: 'No sandbox associated with this build',
        build: {
          id: build.id,
          status: build.status,
          sandboxProvider: build.sandboxProvider,
        },
      });
    }

    // Try to connect to the sandbox
    const sandbox = await e2bProvider.get(build.sandboxId);
    
    if (!sandbox) {
      return NextResponse.json({
        status: 'disconnected',
        message: 'Cannot connect to sandbox - it may have timed out or been destroyed',
        sandboxId: build.sandboxId,
        build: {
          id: build.id,
          status: build.status,
        },
      });
    }

    // Check if sandbox is running
    const isRunning = await sandbox.isRunning();
    
    if (!isRunning) {
      return NextResponse.json({
        status: 'stopped',
        message: 'Sandbox exists but is not running',
        sandboxId: build.sandboxId,
        build: {
          id: build.id,
          status: build.status,
        },
      });
    }

    // Read key files from the sandbox
    const files: Record<string, { exists: boolean; content?: string; size?: number; features?: number; completed?: number }> = {};
    
    // Check feature_list.json
    try {
      const featureListContent = await sandbox.readFile('/home/user/feature_list.json');
      const features: FeatureListItem[] = JSON.parse(featureListContent);
      const completedCount = features.filter(f => f.passes).length;
      
      files['feature_list.json'] = {
        exists: true,
        size: featureListContent.length,
        features: features.length,
        completed: completedCount,
      };
    } catch {
      files['feature_list.json'] = { exists: false };
    }
    
    // Check DESIGN.md
    try {
      const designContent = await sandbox.readFile('/home/user/DESIGN.md');
      files['DESIGN.md'] = {
        exists: true,
        size: designContent.length,
        content: designContent.slice(0, 500) + (designContent.length > 500 ? '...' : ''),
      };
    } catch {
      files['DESIGN.md'] = { exists: false };
    }
    
    // Check app_spec.txt
    try {
      const appSpecContent = await sandbox.readFile('/home/user/app_spec.txt');
      files['app_spec.txt'] = {
        exists: true,
        size: appSpecContent.length,
      };
    } catch {
      files['app_spec.txt'] = { exists: false };
    }
    
    // Check claude-progress.txt
    try {
      const progressContent = await sandbox.readFile('/home/user/claude-progress.txt');
      files['claude-progress.txt'] = {
        exists: true,
        size: progressContent.length,
        content: progressContent.slice(-500), // Last 500 chars
      };
    } catch {
      files['claude-progress.txt'] = { exists: false };
    }
    
    // List top-level files/folders
    let fileList: string[] = [];
    try {
      const lsResult = await sandbox.exec('ls -la /home/user/ 2>/dev/null | head -20');
      fileList = lsResult.stdout.split('\n').filter(line => line.trim());
    } catch {
      // Ignore
    }

    return NextResponse.json({
      status: 'running',
      sandboxId: build.sandboxId,
      build: {
        id: build.id,
        status: build.status,
      },
      files,
      fileList,
      message: 'Sandbox is active and running',
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error checking sandbox status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check sandbox status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


