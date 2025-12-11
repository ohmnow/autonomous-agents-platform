import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import {
  checkRateLimit,
  rateLimits,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';
import {
  createAppSpec,
  listAppSpecs,
  extractAppName,
} from '@repo/database';

// Validation limits
// Note: A detailed 2,000-line spec could be 150-200KB
// We allow up to 1MB to accommodate comprehensive specifications
const MAX_SPEC_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_NAME_LENGTH = 200;
const MAX_LIMIT = 100;

/**
 * GET /api/specs
 * List all app specs for the current user
 */
export async function GET(request: Request) {
  try {
    const { userId } = await ensureUser();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const limitParam = parseInt(searchParams.get('limit') || '20');
    
    // Validate limit
    const limit = Math.min(Math.max(1, limitParam), MAX_LIMIT);

    const specs = await listAppSpecs({ userId, projectId, limit });

    return NextResponse.json({ specs });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error listing specs:', error);
    return NextResponse.json({ error: 'Failed to list specs' }, { status: 500 });
  }
}

/**
 * POST /api/specs
 * Create a new app spec
 */
export async function POST(request: Request) {
  try {
    const { userId } = await ensureUser();

    // Rate limiting: 100 API requests per minute
    const rateLimit = checkRateLimit(`api:${userId}`, rateLimits.api);
    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    const body = await request.json();
    const { name, content, projectId, chatId, format, appDescription } = body as {
      name?: string;
      content: string;
      projectId?: string;
      chatId?: string;
      format?: 'xml' | 'markdown';
      appDescription?: string;
    };

    // Validate content
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Spec content is required' },
        { status: 400 }
      );
    }

    // Validate content size
    if (content.length > MAX_SPEC_SIZE) {
      return NextResponse.json(
        {
          error: 'spec_too_large',
          message: `Specification is too large. Maximum size is ${MAX_SPEC_SIZE / 1024}KB.`,
        },
        { status: 400 }
      );
    }

    // Validate and sanitize name
    let specName = name || extractAppName(content);
    if (specName.length > MAX_NAME_LENGTH) {
      specName = specName.slice(0, MAX_NAME_LENGTH);
    }
    // Basic sanitization - remove control characters
    specName = specName.replace(/[\x00-\x1F\x7F]/g, '');

    // Detect format if not provided
    const specFormat = format || (content.includes('<project_specification>') ? 'xml' : 'markdown');

    const spec = await createAppSpec({
      userId,
      name: specName,
      content,
      projectId,
      chatId,
      format: specFormat,
      appDescription,
    });

    return NextResponse.json({ spec }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating spec:', error);
    return NextResponse.json({ error: 'Failed to create spec' }, { status: 500 });
  }
}
