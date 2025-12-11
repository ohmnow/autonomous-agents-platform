/**
 * @repo/storage
 *
 * Unified storage abstraction layer for the Autonomous Agents Platform.
 *
 * Supports:
 * - MinIO (local development)
 * - AWS S3 (production)
 * - Cloudflare R2 (production)
 * - Local filesystem (fallback)
 *
 * @example
 * ```typescript
 * import { getStorage } from '@repo/storage';
 *
 * const storage = getStorage();
 *
 * // Upload a file
 * await storage.upload('builds/123/artifacts.zip', zipBuffer, {
 *   contentType: 'application/zip',
 * });
 *
 * // Get a download URL
 * const url = await storage.getSignedUrl('builds/123/artifacts.zip');
 *
 * // Download directly
 * const { data, contentType } = await storage.download('builds/123/artifacts.zip');
 * ```
 */

// Types
export type {
  StorageProvider,
  StorageConfig,
  UploadOptions,
  DownloadResult,
  FileInfo,
  ListOptions,
  ListResult,
} from './interface.js';

// Providers
export { S3Provider } from './s3-provider.js';
export { LocalProvider, type LocalStorageConfig } from './local-provider.js';

// Factory & Configuration
export {
  createStorageProvider,
  getStorage,
  resetStorage,
  getStorageConfig,
  getStorageInfo,
  isStorageConfigured,
  type ProviderType,
} from './config.js';
