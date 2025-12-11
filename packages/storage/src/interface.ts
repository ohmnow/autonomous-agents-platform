/**
 * Storage Provider Interface
 *
 * Defines a unified interface for object storage that works with:
 * - MinIO (local development)
 * - AWS S3 (production option)
 * - Cloudflare R2 (production option)
 *
 * All providers use the S3-compatible API.
 */

export interface UploadOptions {
  /** MIME type of the file */
  contentType?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

export interface DownloadResult {
  /** File content as Buffer */
  data: Buffer;
  /** MIME type if available */
  contentType?: string;
  /** File size in bytes */
  size: number;
}

export interface FileInfo {
  /** Storage key */
  key: string;
  /** File size in bytes */
  size: number;
  /** Last modified date */
  lastModified: Date;
  /** MIME type if available */
  contentType?: string;
}

export interface ListOptions {
  /** Prefix to filter keys */
  prefix?: string;
  /** Maximum number of results */
  maxKeys?: number;
  /** Continuation token for pagination */
  continuationToken?: string;
}

export interface ListResult {
  /** Array of file info */
  files: FileInfo[];
  /** Token for next page, if more results exist */
  nextContinuationToken?: string;
  /** Whether there are more results */
  isTruncated: boolean;
}

export interface StorageProvider {
  /**
   * Upload a file to storage
   * @param key - The storage key (path) for the file
   * @param data - The file content as Buffer
   * @param options - Upload options (content type, metadata)
   * @returns The storage key
   */
  upload(key: string, data: Buffer, options?: UploadOptions): Promise<string>;

  /**
   * Download a file from storage
   * @param key - The storage key (path) of the file
   * @returns The file content and metadata
   */
  download(key: string): Promise<DownloadResult>;

  /**
   * Get a pre-signed URL for downloading a file
   * @param key - The storage key (path) of the file
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns A pre-signed URL that allows temporary access
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Get a pre-signed URL for uploading a file
   * @param key - The storage key (path) for the file
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @param options - Upload options (content type)
   * @returns A pre-signed URL that allows temporary upload access
   */
  getSignedUploadUrl(
    key: string,
    expiresIn?: number,
    options?: UploadOptions
  ): Promise<string>;

  /**
   * Delete a file from storage
   * @param key - The storage key (path) of the file
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists in storage
   * @param key - The storage key (path) of the file
   * @returns True if the file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata without downloading
   * @param key - The storage key (path) of the file
   * @returns File info or null if not found
   */
  getInfo(key: string): Promise<FileInfo | null>;

  /**
   * List files in storage
   * @param options - List options (prefix, pagination)
   * @returns List of files and pagination info
   */
  list(options?: ListOptions): Promise<ListResult>;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** S3-compatible endpoint URL (required for MinIO/R2, optional for AWS S3) */
  endpoint?: string;
  /** AWS region (required for AWS S3) */
  region: string;
  /** Access key ID */
  accessKeyId: string;
  /** Secret access key */
  secretAccessKey: string;
  /** Bucket name */
  bucket: string;
  /** Force path-style URLs (required for MinIO) */
  forcePathStyle?: boolean;
}
