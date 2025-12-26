import { auth } from '@clerk/nextjs/server';
import { getStorage, isStorageConfigured } from '@repo/storage';
import { randomUUID } from 'crypto';

/**
 * Upload API Route
 * 
 * Handles file uploads for chat attachments.
 * Files are stored using the configured storage provider (S3/MinIO/local).
 */

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  // Images (supported by Claude vision)
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  // Text-based documents
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  // PDF (future support)
  'application/pdf',
];

// Extension to MIME type mapping for validation
const EXTENSION_TO_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
};

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check if storage is configured
  if (!isStorageConfigured()) {
    return new Response(
      JSON.stringify({ 
        error: 'Storage not configured. Please configure S3_* environment variables.' 
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    let mimeType = file.type;
    
    // If MIME type is empty or generic, try to infer from extension
    if (!mimeType || mimeType === 'application/octet-stream') {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      mimeType = EXTENSION_TO_MIME[ext] || file.type;
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return new Response(
        JSON.stringify({ 
          error: `File type not allowed: ${mimeType}. Allowed types: images, text, markdown, CSV, JSON, PDF` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique storage key
    const fileId = randomUUID();
    const extension = file.name.split('.').pop() || 'bin';
    const storageKey = `attachments/${userId}/${fileId}.${extension}`;

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage
    const storage = getStorage();
    await storage.upload(storageKey, buffer, {
      contentType: mimeType,
      metadata: {
        originalName: file.name,
        uploadedBy: userId,
      },
    });

    // Get signed URL for display
    const signedUrl = await storage.getSignedUrl(storageKey, 3600); // 1 hour expiry

    // Return attachment metadata
    return new Response(
      JSON.stringify({
        id: fileId,
        name: file.name,
        type: mimeType,
        size: file.size,
        url: signedUrl,
        storageKey,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to upload file' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


