import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { DISCOVERY_SYSTEM_PROMPT } from '@repo/agent-core';

/**
 * Chat API Route - Stage 1: Discovery
 * 
 * This route uses the DISCOVERY_SYSTEM_PROMPT to gather requirements
 * and produce an App Description with inferred complexity.
 * 
 * The App Description is then expanded into a full XML spec via
 * the /api/expand-spec route (Stage 2).
 * 
 * Supports file attachments:
 * - Images are sent as base64-encoded image content blocks
 * - Text files are included as text content blocks
 */

// Attachment type from the client
interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  storageKey?: string;
}

// Message type from the client
interface ClientMessage {
  role: string;
  content: string;
  attachments?: MessageAttachment[];
}

/**
 * Dynamically load storage to avoid issues at module load time
 */
async function getStorageModule() {
  try {
    const storage = await import('@repo/storage');
    return storage;
  } catch (error) {
    console.error('Failed to load storage module:', error);
    return null;
  }
}

/**
 * Convert a file attachment to Anthropic content block(s)
 */
async function attachmentToContentBlocks(
  attachment: MessageAttachment
): Promise<Anthropic.ContentBlockParam[]> {
  const blocks: Anthropic.ContentBlockParam[] = [];

  if (!attachment.storageKey) {
    // No storage key - can't retrieve file
    blocks.push({
      type: 'text',
      text: `[Attachment: ${attachment.name} (file not available)]`,
    });
    return blocks;
  }

  // Dynamically import storage module
  const storageModule = await getStorageModule();
  if (!storageModule) {
    blocks.push({
      type: 'text',
      text: `[Attachment: ${attachment.name} (storage module not available)]`,
    });
    return blocks;
  }

  if (!storageModule.isStorageConfigured()) {
    blocks.push({
      type: 'text',
      text: `[Attachment: ${attachment.name} (storage not configured)]`,
    });
    return blocks;
  }

  try {
    const storage = storageModule.getStorage();
    const result = await storage.download(attachment.storageKey);

    // Handle images - send as base64 image blocks
    if (attachment.type.startsWith('image/')) {
      const mediaType = attachment.type as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: result.data.toString('base64'),
        },
      });
      return blocks;
    }

    // Handle text-based files - include content as text
    if (
      attachment.type.startsWith('text/') ||
      attachment.type === 'application/json'
    ) {
      const textContent = result.data.toString('utf-8');
      // Limit text content to prevent token overflow
      const maxLength = 50000; // ~12.5k tokens
      const truncated = textContent.length > maxLength;
      const displayContent = truncated
        ? textContent.slice(0, maxLength) + '\n... [content truncated]'
        : textContent;

      blocks.push({
        type: 'text',
        text: `[File: ${attachment.name}]\n\`\`\`\n${displayContent}\n\`\`\``,
      });
      return blocks;
    }

    // Handle PDFs - for now just note their presence (future: extract text)
    if (attachment.type === 'application/pdf') {
      blocks.push({
        type: 'text',
        text: `[PDF Document: ${attachment.name} - ${Math.round(attachment.size / 1024)}KB]\nNote: PDF content extraction not yet implemented. The user has attached this PDF for reference.`,
      });
      return blocks;
    }

    // Unknown file type
    blocks.push({
      type: 'text',
      text: `[File: ${attachment.name} (${attachment.type}, ${Math.round(attachment.size / 1024)}KB)]`,
    });
  } catch (error) {
    console.error(`Failed to load attachment ${attachment.name}:`, error);
    blocks.push({
      type: 'text',
      text: `[Attachment: ${attachment.name} (failed to load)]`,
    });
  }

  return blocks;
}

/**
 * Convert client message to Anthropic message format
 */
async function convertToAnthropicMessage(
  msg: ClientMessage
): Promise<Anthropic.MessageParam> {
  // If no attachments, return simple string content
  if (!msg.attachments || msg.attachments.length === 0) {
    return {
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    };
  }

  // Build content blocks array
  const contentBlocks: Anthropic.ContentBlockParam[] = [];

  // Add attachment content blocks first (so images appear before text in context)
  for (const attachment of msg.attachments) {
    const blocks = await attachmentToContentBlocks(attachment);
    contentBlocks.push(...blocks);
  }

  // Add the user's text message
  if (msg.content.trim()) {
    contentBlocks.push({
      type: 'text',
      text: msg.content,
    });
  }

  return {
    role: msg.role as 'user' | 'assistant',
    content: contentBlocks,
  };
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Check for authentication (OAuth token preferred, API key as fallback)
    // Supports both ANTHROPIC_AUTH_TOKEN and CLAUDE_CODE_OAUTH_TOKEN for flexibility
    const authToken = process.env.ANTHROPIC_AUTH_TOKEN || process.env.CLAUDE_CODE_OAUTH_TOKEN;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!authToken && !apiKey) {
      return new Response('Anthropic authentication not configured', { status: 500 });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey || undefined,
      authToken: authToken || undefined,
    });

    // Convert messages to Anthropic format (with attachment handling)
    const anthropicMessages = await Promise.all(
      (messages as ClientMessage[]).map((msg) => convertToAnthropicMessage(msg))
    );

    // Create streaming response
    // Using 16384 tokens for discovery stage (App Description is much shorter than full spec)
    const stream = await anthropic.messages.stream({
      model: 'claude-opus-4-5', // Opus 4.5 for highest quality discovery
      max_tokens: 32768, // Increased for comprehensive discovery conversations
      system: DISCOVERY_SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              // Send the text delta as SSE
              const data = JSON.stringify({
                type: 'text',
                content: event.delta.text,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (event.type === 'message_stop') {
              // Send completion signal
              const data = JSON.stringify({ type: 'done' });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.close();
        } catch (error) {
          const errorData = JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
