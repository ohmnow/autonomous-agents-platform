/**
 * Build Approval API
 * 
 * POST /api/builds/[id]/approve
 * Approves the current review gate and continues the build
 * 
 * Body: { 
 *   gate: 'design' | 'features',
 *   editedContent?: string  // Optional: if user edited the file
 * }
 */

import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { getBuildById, updateBuild } from '@repo/database';
import { e2bProvider } from '@repo/sandbox-providers';
import { BuildStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/builds/[id]/approve
 * Approve a review gate and continue the build
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;
    
    const body = await request.json();
    const { gate, editedContent } = body;
    
    if (!gate || !['design', 'features'].includes(gate)) {
      return NextResponse.json({ 
        error: 'Invalid gate. Must be "design" or "features"' 
      }, { status: 400 });
    }

    const build = await getBuildById(id);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (build.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate the build is in the correct state for this approval
    const expectedStatus = gate === 'design' 
      ? 'AWAITING_DESIGN_REVIEW' 
      : 'AWAITING_FEATURE_REVIEW';
    
    if (build.status !== expectedStatus) {
      return NextResponse.json({ 
        error: `Build is not awaiting ${gate} review. Current status: ${build.status}` 
      }, { status: 400 });
    }

    // If edited content was provided, update the file in the sandbox
    if (editedContent && build.sandboxId) {
      const sandbox = await e2bProvider.get(build.sandboxId);
      
      if (sandbox) {
        const isRunning = await sandbox.isRunning();
        if (isRunning) {
          const filePath = gate === 'design' 
            ? '/home/user/DESIGN.md' 
            : '/home/user/feature_list.json';
          
          // Validate JSON for feature list
          if (gate === 'features') {
            try {
              JSON.parse(editedContent);
            } catch {
              return NextResponse.json({ 
                error: 'Invalid JSON in feature list' 
              }, { status: 400 });
            }
          }
          
          await sandbox.writeFile(filePath, editedContent);
        }
      }
    }

    // Update build status and approval timestamp
    const now = new Date();
    const updateData: {
      status: BuildStatus;
      designApprovedAt?: Date;
      featuresApprovedAt?: Date;
    } = {
      status: 'RUNNING' as BuildStatus,
    };

    if (gate === 'design') {
      updateData.designApprovedAt = now;
      // After design approval, the build will continue to generate feature_list.json
      // The runner will set status to AWAITING_FEATURE_REVIEW if gates are enabled
    } else {
      updateData.featuresApprovedAt = now;
      // After features approval, the build will continue to the building phase
    }

    const updatedBuild = await updateBuild(id, updateData);

    return NextResponse.json({
      success: true,
      build: {
        id: updatedBuild.id,
        status: updatedBuild.status,
        designApprovedAt: updatedBuild.designApprovedAt?.toISOString(),
        featuresApprovedAt: updatedBuild.featuresApprovedAt?.toISOString(),
      },
      message: `${gate === 'design' ? 'Design' : 'Feature list'} approved. Build continuing...`,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error approving build gate:', error);
    return NextResponse.json(
      { 
        error: 'Failed to approve',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

