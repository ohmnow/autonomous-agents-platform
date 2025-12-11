/**
 * Storage Provider Tests
 *
 * These tests require MinIO to be running locally.
 * Run: docker compose up -d
 *
 * To run tests: pnpm --filter @repo/storage test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { S3Provider } from './s3-provider.js';
import { LocalProvider } from './local-provider.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// MinIO test configuration
const minioConfig = {
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  accessKeyId: 'minioadmin',
  secretAccessKey: 'minioadmin123',
  bucket: 'build-artifacts',
  forcePathStyle: true,
};

// Local test configuration
const localTestDir = './.storage-test';
const localConfig = {
  basePath: localTestDir,
};

describe('S3Provider (MinIO)', () => {
  const storage = new S3Provider(minioConfig);
  const testKey = `test/${Date.now()}-test-file.txt`;
  const testContent = Buffer.from('Hello, MinIO! This is a test file.');

  afterAll(async () => {
    // Clean up test file
    try {
      await storage.delete(testKey);
    } catch {
      // Ignore if already deleted
    }
  });

  it('should upload a file', async () => {
    const result = await storage.upload(testKey, testContent, {
      contentType: 'text/plain',
    });
    expect(result).toBe(testKey);
  });

  it('should check if file exists', async () => {
    const exists = await storage.exists(testKey);
    expect(exists).toBe(true);

    const notExists = await storage.exists('non-existent-file.txt');
    expect(notExists).toBe(false);
  });

  it('should get file info', async () => {
    const info = await storage.getInfo(testKey);
    expect(info).not.toBeNull();
    expect(info!.key).toBe(testKey);
    expect(info!.size).toBe(testContent.length);
    expect(info!.contentType).toBe('text/plain');
  });

  it('should download a file', async () => {
    const result = await storage.download(testKey);
    expect(result.data.toString()).toBe(testContent.toString());
    expect(result.contentType).toBe('text/plain');
    expect(result.size).toBe(testContent.length);
  });

  it('should generate a signed URL', async () => {
    const url = await storage.getSignedUrl(testKey, 60);
    expect(url).toContain(minioConfig.endpoint);
    expect(url).toContain(testKey);
    expect(url).toContain('X-Amz-Signature');
  });

  it('should list files', async () => {
    const result = await storage.list({ prefix: 'test/' });
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files.some((f) => f.key === testKey)).toBe(true);
  });

  it('should delete a file', async () => {
    await storage.delete(testKey);
    const exists = await storage.exists(testKey);
    expect(exists).toBe(false);
  });
});

describe('LocalProvider', () => {
  const storage = new LocalProvider(localConfig);
  const testKey = 'test-file.txt';
  const testContent = Buffer.from('Hello, Local Storage!');

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(localTestDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(localTestDir, { recursive: true });
    } catch {
      // Ignore
    }
  });

  it('should upload a file', async () => {
    const result = await storage.upload(testKey, testContent, {
      contentType: 'text/plain',
    });
    expect(result).toBe(testKey);
  });

  it('should check if file exists', async () => {
    const exists = await storage.exists(testKey);
    expect(exists).toBe(true);
  });

  it('should download a file', async () => {
    const result = await storage.download(testKey);
    expect(result.data.toString()).toBe(testContent.toString());
    expect(result.contentType).toBe('text/plain');
  });

  it('should get file info', async () => {
    const info = await storage.getInfo(testKey);
    expect(info).not.toBeNull();
    expect(info!.key).toBe(testKey);
    expect(info!.size).toBe(testContent.length);
  });

  it('should delete a file', async () => {
    await storage.delete(testKey);
    const exists = await storage.exists(testKey);
    expect(exists).toBe(false);
  });

  it('should handle nested paths', async () => {
    const nestedKey = 'builds/123/artifacts/code.zip';
    await storage.upload(nestedKey, testContent);
    const exists = await storage.exists(nestedKey);
    expect(exists).toBe(true);
    await storage.delete(nestedKey);
  });
});
