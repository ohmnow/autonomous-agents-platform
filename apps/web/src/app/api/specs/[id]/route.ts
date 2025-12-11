import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import {
  getAppSpecById,
  updateAppSpec,
  deleteAppSpec,
} from '@repo/database';

// Match the limit from the main specs route
const MAX_SPEC_SIZE = 1 * 1024 * 1024; // 1MB

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/specs/[id]
 * Get a specific app spec
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    const spec = await getAppSpecById(id);

    if (!spec) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    if (spec.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ spec });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching spec:', error);
    return NextResponse.json({ error: 'Failed to fetch spec' }, { status: 500 });
  }
}

/**
 * PATCH /api/specs/[id]
 * Update an app spec
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;
    const body = await request.json();
    const { name, content, projectId } = body;

    let spec = await getAppSpecById(id);

    if (!spec) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    if (spec.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate content size if provided
    if (content !== undefined && typeof content === 'string') {
      if (content.length > MAX_SPEC_SIZE) {
        return NextResponse.json(
          {
            error: 'spec_too_large',
            message: `Specification is too large. Maximum size is ${MAX_SPEC_SIZE / 1024 / 1024}MB.`,
          },
          { status: 400 }
        );
      }
    }

    spec = await updateAppSpec(id, {
      ...(name !== undefined && { name }),
      ...(content !== undefined && { content }),
      ...(projectId !== undefined && { projectId }),
    });

    return NextResponse.json({ spec });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating spec:', error);
    return NextResponse.json({ error: 'Failed to update spec' }, { status: 500 });
  }
}

/**
 * DELETE /api/specs/[id]
 * Delete an app spec
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    const spec = await getAppSpecById(id);

    if (!spec) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    if (spec.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteAppSpec(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting spec:', error);
    return NextResponse.json({ error: 'Failed to delete spec' }, { status: 500 });
  }
}
