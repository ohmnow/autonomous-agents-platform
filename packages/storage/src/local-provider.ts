/**
 * Local Filesystem Storage Provider
 *
 * Fallback for development without Docker/MinIO.
 * Stores files in a local directory.
 *
 * Note: Signed URLs are not truly "signed" - they just return file paths.
 * This provider is for development only and should not be used in production.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  StorageProvider,
  UploadOptions,
  DownloadResult,
  FileInfo,
  ListOptions,
  ListResult,
} from './interface.js';

export interface LocalStorageConfig {
  /** Base directory for storage */
  basePath: string;
  /** Base URL for generating "signed" URLs (defaults to file:// protocol) */
  baseUrl?: string;
}

export class LocalProvider implements StorageProvider {
  private basePath: string;
  private baseUrl: string;

  constructor(config: LocalStorageConfig) {
    this.basePath = config.basePath;
    this.baseUrl = config.baseUrl ?? `file://${config.basePath}`;
  }

  private getFilePath(key: string): string {
    // Prevent path traversal attacks
    const normalizedKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.basePath, normalizedKey);
  }

  private getMetaPath(key: string): string {
    return this.getFilePath(key) + '.meta.json';
  }

  async upload(
    key: string,
    data: Buffer,
    options?: UploadOptions
  ): Promise<string> {
    const filePath = this.getFilePath(key);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, data);

    // Write metadata
    if (options?.contentType || options?.metadata) {
      const meta = {
        contentType: options.contentType,
        metadata: options.metadata,
        uploadedAt: new Date().toISOString(),
      };
      await fs.writeFile(this.getMetaPath(key), JSON.stringify(meta, null, 2));
    }

    return key;
  }

  async download(key: string): Promise<DownloadResult> {
    const filePath = this.getFilePath(key);

    try {
      const data = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);

      // Try to read metadata
      let contentType: string | undefined;
      try {
        const metaContent = await fs.readFile(this.getMetaPath(key), 'utf-8');
        const meta = JSON.parse(metaContent);
        contentType = meta.contentType;
      } catch {
        // No metadata file
      }

      return {
        data,
        contentType,
        size: stats.size,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${key}`);
      }
      throw error;
    }
  }

  async getSignedUrl(key: string, _expiresIn?: number): Promise<string> {
    // For local storage, we just return a URL to the file
    // In a real local dev server scenario, you might serve these via an API route
    const exists = await this.exists(key);
    if (!exists) {
      throw new Error(`File not found: ${key}`);
    }
    return `${this.baseUrl}/${key}`;
  }

  async getSignedUploadUrl(
    key: string,
    _expiresIn?: number,
    _options?: UploadOptions
  ): Promise<string> {
    // Local storage doesn't support pre-signed upload URLs
    // Return a placeholder that indicates direct upload should be used
    return `${this.baseUrl}/${key}?upload=true`;
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    // Also try to delete metadata
    try {
      await fs.unlink(this.getMetaPath(key));
    } catch {
      // Ignore if no metadata file
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getInfo(key: string): Promise<FileInfo | null> {
    const filePath = this.getFilePath(key);

    try {
      const stats = await fs.stat(filePath);

      // Try to read metadata
      let contentType: string | undefined;
      try {
        const metaContent = await fs.readFile(this.getMetaPath(key), 'utf-8');
        const meta = JSON.parse(metaContent);
        contentType = meta.contentType;
      } catch {
        // No metadata file
      }

      return {
        key,
        size: stats.size,
        lastModified: stats.mtime,
        contentType,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const files: FileInfo[] = [];
    const prefix = options?.prefix ?? '';
    const maxKeys = options?.maxKeys ?? 1000;

    async function walkDir(
      dir: string,
      baseDir: string,
      fileList: FileInfo[]
    ): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (fileList.length >= maxKeys) break;

          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(baseDir, fullPath);

          if (entry.isDirectory()) {
            await walkDir(fullPath, baseDir, fileList);
          } else if (
            entry.isFile() &&
            !entry.name.endsWith('.meta.json') &&
            relativePath.startsWith(prefix)
          ) {
            const stats = await fs.stat(fullPath);
            fileList.push({
              key: relativePath,
              size: stats.size,
              lastModified: stats.mtime,
            });
          }
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }

    await walkDir(this.basePath, this.basePath, files);

    return {
      files: files.slice(0, maxKeys),
      isTruncated: files.length > maxKeys,
    };
  }
}
