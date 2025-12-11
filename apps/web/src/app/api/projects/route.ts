import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import {
  createProject,
  listProjects,
} from '@repo/database';

/**
 * GET /api/projects
 * List all projects for the current user
 */
export async function GET() {
  try {
    const { userId } = await ensureUser();
    const projects = await listProjects({ userId, limit: 100 });
    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error listing projects:', error);
    return NextResponse.json({ error: 'Failed to list projects' }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: Request) {
  try {
    const { userId } = await ensureUser();
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await createProject({
      userId,
      name: name.trim(),
      description: description?.trim() || null,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
