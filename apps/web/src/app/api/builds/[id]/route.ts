import { NextResponse } from 'next/server';
import { stopBuild } from '@/lib/sandbox/build-runner';
import { ensureUser } from '@/lib/auth';
import {
  getBuildById,
  updateBuild,
  deleteBuild,
} from '@repo/database';
import type { BuildStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
 * GET /api/builds/[id]
 * Get a specific build by ID
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

    return NextResponse.json({
      build: {
        ...build,
        name: extractAppName(build.appSpec),
        progress: build.progress || { completed: 0, total: 0 },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching build:', error);
    return NextResponse.json({ error: 'Failed to fetch build' }, { status: 500 });
  }
}

/**
 * PATCH /api/builds/[id]
 * Update a build (e.g., cancel it)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status transition
    const validStatuses = ['CANCELLED', 'RUNNING', 'COMPLETED', 'FAILED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    let build = await getBuildById(id);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (build.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle cancellation - stop the sandbox
    if (status === 'CANCELLED' && build.status === 'RUNNING') {
      await stopBuild(id);
    }

    // Update the build
    if (status) {
      build = await updateBuild(id, { status: status as BuildStatus });
    }

    return NextResponse.json({
      build: {
        ...build,
        name: extractAppName(build.appSpec),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating build:', error);
    return NextResponse.json(
      { error: 'Failed to update build' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/builds/[id]
 * Delete a build
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

    await deleteBuild(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting build:', error);
    return NextResponse.json(
      { error: 'Failed to delete build' },
      { status: 500 }
    );
  }
}
