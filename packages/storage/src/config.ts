/**
 * Storage Configuration & Factory
 *
 * Creates the appropriate storage provider based on environment variables.
 *
 * Environment Variables:
 * - STORAGE_PROVIDER: 'minio' | 's3' | 'r2' | 'local' (default: auto-detect)
 * - S3_ENDPOINT: Custom endpoint for MinIO/R2
 * - S3_REGION: AWS region (default: 'us-east-1')
 * - S3_ACCESS_KEY_ID: Access key
 * - S3_SECRET_ACCESS_KEY: Secret key
 * - S3_BUCKET_NAME: Bucket name (default: 'build-artifacts')
 * - LOCAL_STORAGE_PATH: Path for local storage (default: './storage')
 */

import type { StorageProvider, StorageConfig } from './interface.js';
import { S3Provider } from './s3-provider.js';
import { LocalProvider, type LocalStorageConfig } from './local-provider.js';

export type ProviderType = 'minio' | 's3' | 'r2' | 'local';

/**
 * Detect the provider type from environment variables
 */
function detectProviderType(): ProviderType {
  const explicit = process.env.STORAGE_PROVIDER?.toLowerCase();
  if (explicit && ['minio', 's3', 'r2', 'local'].includes(explicit)) {
    return explicit as ProviderType;
  }

  const endpoint = process.env.S3_ENDPOINT;
  if (!endpoint) {
    // No endpoint = likely AWS S3 or local
    if (process.env.S3_ACCESS_KEY_ID) {
      return 's3';
    }
    return 'local';
  }

  // Check endpoint for known patterns
  if (endpoint.includes('r2.cloudflarestorage.com')) {
    return 'r2';
  }
  if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
    return 'minio';
  }

  // Default to S3-compatible
  return 's3';
}

/**
 * Get storage configuration from environment variables
 */
export function getStorageConfig(): StorageConfig | LocalStorageConfig {
  const providerType = detectProviderType();

  if (providerType === 'local') {
    return {
      basePath: process.env.LOCAL_STORAGE_PATH ?? './storage',
      baseUrl: process.env.LOCAL_STORAGE_URL,
    } as LocalStorageConfig;
  }

  return {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.S3_BUCKET_NAME ?? 'build-artifacts',
    forcePathStyle: providerType === 'minio', // MinIO requires path-style
  };
}

/**
 * Create a storage provider instance
 */
export function createStorageProvider(
  config?: StorageConfig | LocalStorageConfig
): StorageProvider {
  const providerType = detectProviderType();
  const resolvedConfig = config ?? getStorageConfig();

  if (providerType === 'local') {
    return new LocalProvider(resolvedConfig as LocalStorageConfig);
  }

  return new S3Provider(resolvedConfig as StorageConfig);
}

/**
 * Singleton storage instance
 * Lazily initialized on first use
 */
let storageInstance: StorageProvider | null = null;

/**
 * Get the global storage provider instance
 * Creates one if it doesn't exist
 */
export function getStorage(): StorageProvider {
  if (!storageInstance) {
    storageInstance = createStorageProvider();
  }
  return storageInstance;
}

/**
 * Reset the storage instance (useful for testing)
 */
export function resetStorage(): void {
  storageInstance = null;
}

/**
 * Check if storage is properly configured
 */
export function isStorageConfigured(): boolean {
  const providerType = detectProviderType();

  if (providerType === 'local') {
    return true; // Local always works
  }

  // Check required credentials
  return !!(
    process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
  );
}

/**
 * Get information about current storage configuration
 */
export function getStorageInfo(): {
  provider: ProviderType;
  configured: boolean;
  endpoint?: string;
  bucket: string;
} {
  const providerType = detectProviderType();
  const config = getStorageConfig();

  if ('basePath' in config) {
    return {
      provider: 'local',
      configured: true,
      bucket: config.basePath,
    };
  }

  return {
    provider: providerType,
    configured: isStorageConfigured(),
    endpoint: config.endpoint,
    bucket: config.bucket,
  };
}
