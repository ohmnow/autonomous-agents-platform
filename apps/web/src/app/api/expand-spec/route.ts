import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { EXPANSION_SYSTEM_PROMPT } from '@repo/agent-core';
import { extractAppSpecWithMetadata, type ComplexityTier } from '@/lib/utils/extract-spec';

/**
 * Expand-Spec API Route - Stage 2: Expansion
 * 
 * Takes an App Description (from Stage 1 Discovery) and expands it
 * into a full XML app specification using the EXPANSION_SYSTEM_PROMPT.
 */

interface ExpandSpecRequest {
  appDescription: string;
  complexityTier?: ComplexityTier;
  targetFeatureCount?: number;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json() as ExpandSpecRequest;
    const { appDescription, complexityTier, targetFeatureCount } = body;

    if (!appDescription || appDescription.length < 50) {
      return new Response('Invalid or missing appDescription', { status: 400 });
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

    // Build the user message with optional complexity override
    let userMessage = `Expand this App Description into a full XML specification:\n\n${appDescription}`;
    
    if (complexityTier || targetFeatureCount) {
      userMessage += '\n\n## Override Information';
      if (complexityTier) {
        userMessage += `\nComplexity Tier Override: ${complexityTier}`;
      }
      if (targetFeatureCount) {
        userMessage += `\nTarget Feature Count Override: ${targetFeatureCount}`;
      }
    }

    // Create streaming response for the expansion
    const stream = await anthropic.messages.stream({
      model: 'claude-opus-4-5', // Opus 4.5 for highest quality spec generation
      max_tokens: 64000, // Maximum tokens for Opus 4.5 (supports 400+ features)
      system: EXPANSION_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              fullContent += event.delta.text;
              
              // Send the text delta as SSE
              const data = JSON.stringify({
                type: 'text',
                content: event.delta.text,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (event.type === 'message_stop') {
              // Extract the final spec and send metadata
              const extracted = extractAppSpecWithMetadata(fullContent);
              
              const data = JSON.stringify({
                type: 'done',
                metadata: extracted ? {
                  format: extracted.format,
                  complexity: extracted.complexity,
                  targetFeatures: extracted.targetFeatures,
                  name: extracted.name,
                } : null,
              });
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
    console.error('Expand-Spec API error:', error);
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
