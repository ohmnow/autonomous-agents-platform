import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import {
  createChatSession,
  listChatSessions,
  generateChatTitle,
  createAppSpec,
  extractAppName,
} from '@repo/database';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * GET /api/chats
 * List all chat sessions for the current user
 */
export async function GET(request: Request) {
  try {
    const { userId } = await ensureUser();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    const chats = await listChatSessions({ userId, projectId, limit });

    return NextResponse.json({ chats });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error listing chats:', error);
    return NextResponse.json({ error: 'Failed to list chats' }, { status: 500 });
  }
}

/**
 * POST /api/chats
 * Create a new chat session
 */
export async function POST(request: Request) {
  try {
    const { userId } = await ensureUser();
    const body = await request.json();
    const { projectId, title, messages, appSpec, appDescription } = body;

    // Generate title from first message if not provided
    const chatTitle = title || (messages?.length > 0 
      ? generateChatTitle(messages as ChatMessage[]) 
      : 'New Chat');

    const chat = await createChatSession({
      userId,
      projectId,
      title: chatTitle,
      messages: messages || [],
    });

    // If appSpec content is provided, create/update the linked AppSpec
    if (appSpec && chat.id) {
      try {
        const isXml = appSpec.includes('<project_specification>');
        const specName = extractAppName(appSpec);
        await createAppSpec({
          chatId: chat.id,
          userId,
          name: specName,
          projectId: projectId || undefined,
          content: appSpec,
          format: isXml ? 'xml' : 'markdown',
          appDescription: appDescription || undefined,
        });
      } catch (specError) {
        console.error('Failed to save appSpec with chat:', specError);
        // Don't fail the whole request if spec save fails
      }
    }

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
