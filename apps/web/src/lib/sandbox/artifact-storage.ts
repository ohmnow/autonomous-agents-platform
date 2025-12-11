/**
 * Artifact Storage
 *
 * Handles saving and retrieving build artifacts from object storage.
 * Works with MinIO (local), AWS S3, or Cloudflare R2 (production).
 * 
 * Artifacts are stored as ZIP files for easy user access.
 */

import { getStorage, isStorageConfigured, getStorageInfo } from '@repo/storage';
import type { Sandbox } from '@repo/sandbox-providers';
import * as tar from 'tar-stream';
import archiver from 'archiver';
import { Readable, PassThrough } from 'stream';
import { gunzipSync } from 'zlib';

/**
 * Storage key format for build artifacts
 */
export function getArtifactKey(buildId: string): string {
  return `builds/${buildId}/artifacts.zip`;
}

/**
 * Check if a buffer is gzipped by looking at the magic bytes
 */
function isGzipped(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

/**
 * Decompress a gzipped buffer if needed
 */
function maybeDecompress(buffer: Buffer): Buffer {
  if (isGzipped(buffer)) {
    console.log('[artifact-storage] Detected gzipped tar, decompressing...');
    return gunzipSync(buffer);
  }
  return buffer;
}

/**
 * Convert a tar buffer to a zip buffer
 * This allows us to provide user-friendly ZIP downloads even though
 * the sandbox produces tar archives.
 * 
 * Handles both plain tar and gzipped tar (.tar.gz) formats.
 */
async function tarToZip(tarBuffer: Buffer): Promise<Buffer> {
  // Handle gzipped tar files
  const decompressedBuffer = maybeDecompress(tarBuffer);
  
  // Log first few bytes for debugging
  console.log(`[artifact-storage] Tar buffer size: ${decompressedBuffer.length} bytes`);
  console.log(`[artifact-storage] First 10 bytes: ${Array.from(decompressedBuffer.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    let fileCount = 0;

    // Collect zip output
    const outputStream = new PassThrough();
    archive.pipe(outputStream);
    
    outputStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    outputStream.on('end', () => {
      console.log(`[artifact-storage] Created ZIP with ${fileCount} files`);
      resolve(Buffer.concat(chunks));
    });
    outputStream.on('error', reject);

    extract.on('entry', (header, stream, next) => {
      if (header.type === 'file') {
        const fileChunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => fileChunks.push(chunk));
        stream.on('end', () => {
          const content = Buffer.concat(fileChunks);
          // Remove leading ./ if present
          const filePath = header.name.replace(/^\.\//, '');
          if (filePath) {
            archive.append(content, { name: filePath });
            fileCount++;
          }
          next();
        });
        stream.resume();
      } else if (header.type === 'directory') {
        // ZIP handles directories implicitly, skip
        stream.resume();
        next();
      } else {
        stream.resume();
        next();
      }
    });

    extract.on('finish', () => {
      archive.finalize();
    });

    extract.on('error', (err) => {
      console.error(`[artifact-storage] Tar extraction error: ${err.message}`);
      reject(err);
    });
    archive.on('error', reject);

    // Feed the tar buffer to the extractor
    const readable = new Readable();
    readable.push(decompressedBuffer);
    readable.push(null);
    readable.pipe(extract);
  });
}

/**
 * Check if artifact storage is available
 */
export function isArtifactStorageAvailable(): boolean {
  return isStorageConfigured();
}

/**
 * Get information about artifact storage configuration
 */
export function getArtifactStorageInfo(): {
  available: boolean;
  provider: string;
  bucket: string;
} {
  const info = getStorageInfo();
  return {
    available: info.configured,
    provider: info.provider,
    bucket: info.bucket,
  };
}

/**
 * Save build artifacts from sandbox to storage
 *
 * @param buildId - The build ID
 * @param sandbox - The sandbox to download artifacts from
 * @param workspacePath - The path to the workspace directory (default: /home/user)
 * @returns The storage key for the uploaded artifacts
 */
export async function saveBuildArtifacts(
  buildId: string,
  sandbox: Sandbox,
  workspacePath: string = '/home/user'
): Promise<string> {
  if (!isStorageConfigured()) {
    throw new Error('Storage is not configured. Set S3_* environment variables.');
  }

  const storage = getStorage();
  const artifactKey = getArtifactKey(buildId);

  // Download the workspace directory as a tar archive
  const tarBuffer = await sandbox.downloadDir(workspacePath);

  // Convert tar to ZIP for user-friendly downloads
  const zipBuffer = await tarToZip(tarBuffer);

  // Upload to storage
  await storage.upload(artifactKey, zipBuffer, {
    contentType: 'application/zip',
    metadata: {
      buildId,
      originalPath: workspacePath,
      createdAt: new Date().toISOString(),
    },
  });

  return artifactKey;
}

/**
 * Get a signed download URL for build artifacts
 *
 * @param artifactKey - The storage key for the artifacts
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns A signed URL for downloading the artifacts
 */
export async function getArtifactDownloadUrl(
  artifactKey: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!isStorageConfigured()) {
    throw new Error('Storage is not configured. Set S3_* environment variables.');
  }

  const storage = getStorage();
  return storage.getSignedUrl(artifactKey, expiresIn);
}

/**
 * Check if artifacts exist for a build
 *
 * @param buildId - The build ID
 * @returns True if artifacts exist
 */
export async function artifactsExist(buildId: string): Promise<boolean> {
  if (!isStorageConfigured()) {
    return false;
  }

  const storage = getStorage();
  const artifactKey = getArtifactKey(buildId);
  return storage.exists(artifactKey);
}

/**
 * Get artifact info (size, date)
 *
 * @param buildId - The build ID
 * @returns Artifact info or null if not found
 */
export async function getArtifactInfo(buildId: string): Promise<{
  key: string;
  size: number;
  lastModified: Date;
} | null> {
  if (!isStorageConfigured()) {
    return null;
  }

  const storage = getStorage();
  const artifactKey = getArtifactKey(buildId);
  const info = await storage.getInfo(artifactKey);

  if (!info) {
    return null;
  }

  return {
    key: info.key,
    size: info.size,
    lastModified: info.lastModified,
  };
}

/**
 * Delete artifacts for a build
 *
 * @param buildId - The build ID
 */
export async function deleteArtifacts(buildId: string): Promise<void> {
  if (!isStorageConfigured()) {
    return;
  }

  const storage = getStorage();
  const artifactKey = getArtifactKey(buildId);
  await storage.delete(artifactKey);
}
