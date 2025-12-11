import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { getBuildById } from '@repo/database';
import {
  getArtifactDownloadUrl,
  getArtifactInfo,
  isArtifactStorageAvailable,
} from '@/lib/sandbox/artifact-storage';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/builds/[id]/download
 * Download build artifacts
 *
 * Query params:
 * - info=true: Return artifact info instead of redirecting to download
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;
    const url = new URL(request.url);
    const infoOnly = url.searchParams.get('info') === 'true';

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
        { error: 'Build not completed. Cannot download artifacts.' },
        { status: 400 }
      );
    }

    // Check if artifact storage is available
    if (!isArtifactStorageAvailable()) {
      return NextResponse.json(
        {
          error: 'Artifact storage not configured',
          message: 'Set S3_* environment variables to enable artifact storage.',
        },
        { status: 503 }
      );
    }

    // Check if artifacts exist for this build
    if (!build.artifactKey) {
      return NextResponse.json(
        {
          error: 'No artifacts available',
          message: 'This build does not have saved artifacts. The build may have been created before artifact storage was enabled.',
        },
        { status: 404 }
      );
    }

    // Determine file format from artifact key
    const isZip = build.artifactKey.endsWith('.zip');
    const contentType = isZip ? 'application/zip' : 'application/gzip';
    const extension = isZip ? 'zip' : 'tar.gz';
    const filename = `build-${id}-artifacts.${extension}`;

    // If info only, return artifact metadata
    if (infoOnly) {
      const info = await getArtifactInfo(id);
      if (!info) {
        return NextResponse.json(
          { error: 'Artifact info not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        buildId: id,
        artifactKey: build.artifactKey,
        size: info.size,
        lastModified: info.lastModified.toISOString(),
        contentType,
        filename,
      });
    }

    // Generate signed download URL and redirect
    const downloadUrl = await getArtifactDownloadUrl(build.artifactKey, 3600);

    // Redirect to signed URL
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error downloading artifacts:', error);
    return NextResponse.json(
      { error: 'Failed to download artifacts' },
      { status: 500 }
    );
  }
}
