/**
 * Build Files API
 * 
 * GET /api/builds/[id]/files?path=/home/user/DESIGN.md
 * Returns the full content of a file from the sandbox
 * 
 * PUT /api/builds/[id]/files
 * Updates a file in the sandbox
 */

import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { getBuildById } from '@repo/database';
import { e2bProvider } from '@repo/sandbox-providers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/builds/[id]/files?path=<filepath>
 * Read a file from the sandbox
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;
    
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'Missing path query parameter' }, { status: 400 });
    }

    const build = await getBuildById(id);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (build.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!build.sandboxId) {
      return NextResponse.json({
        error: 'No sandbox associated with this build',
        status: 'no_sandbox',
      }, { status: 404 });
    }

    // Connect to the sandbox
    const sandbox = await e2bProvider.get(build.sandboxId);
    
    if (!sandbox) {
      return NextResponse.json({
        error: 'Cannot connect to sandbox - it may have timed out',
        status: 'disconnected',
      }, { status: 503 });
    }

    // Check if sandbox is running
    const isRunning = await sandbox.isRunning();
    if (!isRunning) {
      return NextResponse.json({
        error: 'Sandbox is not running',
        status: 'stopped',
      }, { status: 503 });
    }

    // Read the file
    try {
      const content = await sandbox.readFile(filePath);
      
      // Determine file type for syntax highlighting hints
      const extension = filePath.split('.').pop()?.toLowerCase() || '';
      const languageMap: Record<string, string> = {
        'md': 'markdown',
        'json': 'json',
        'ts': 'typescript',
        'tsx': 'typescript',
        'js': 'javascript',
        'jsx': 'javascript',
        'css': 'css',
        'html': 'html',
        'txt': 'text',
        'py': 'python',
      };
      
      return NextResponse.json({
        path: filePath,
        content,
        size: content.length,
        language: languageMap[extension] || 'text',
        exists: true,
      });
    } catch (error) {
      // File doesn't exist
      return NextResponse.json({
        path: filePath,
        exists: false,
        error: 'File not found',
      }, { status: 404 });
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error reading file from sandbox:', error);
    return NextResponse.json(
      { 
        error: 'Failed to read file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/builds/[id]/files
 * Write/update a file in the sandbox
 * 
 * Body: { path: string, content: string }
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;
    
    const body = await request.json();
    const { path: filePath, content } = body;
    
    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid path' }, { status: 400 });
    }
    
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    const build = await getBuildById(id);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (build.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!build.sandboxId) {
      return NextResponse.json({
        error: 'No sandbox associated with this build',
        status: 'no_sandbox',
      }, { status: 404 });
    }

    // Connect to the sandbox
    const sandbox = await e2bProvider.get(build.sandboxId);
    
    if (!sandbox) {
      return NextResponse.json({
        error: 'Cannot connect to sandbox - it may have timed out',
        status: 'disconnected',
      }, { status: 503 });
    }

    // Check if sandbox is running
    const isRunning = await sandbox.isRunning();
    if (!isRunning) {
      return NextResponse.json({
        error: 'Sandbox is not running',
        status: 'stopped',
      }, { status: 503 });
    }

    // Write the file
    await sandbox.writeFile(filePath, content);
    
    return NextResponse.json({
      success: true,
      path: filePath,
      size: content.length,
      message: 'File updated successfully',
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error writing file to sandbox:', error);
    return NextResponse.json(
      { 
        error: 'Failed to write file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

