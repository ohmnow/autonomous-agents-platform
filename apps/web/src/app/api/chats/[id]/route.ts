import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import {
  getChatSessionById,
  getChatSessionWithAppSpec,
  updateChatSession,
  deleteChatSession,
  generateChatTitle,
  createAppSpec,
  updateAppSpec,
  getAppSpecByChatId,
  extractAppName,
} from '@repo/database';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/chats/[id]
 * Get a specific chat session with linked appSpec
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Get chat with its linked appSpec
    const chat = await getChatSessionWithAppSpec(id);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}

/**
 * PATCH /api/chats/[id]
 * Update a chat session
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;
    const body = await request.json();
    const { title, messages, projectId, appSpec, appDescription } = body;

    let chat = await getChatSessionById(id);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Auto-generate title from messages if updating messages and no title provided
    let newTitle = title;
    if (messages && !title && chat.title === 'New Chat') {
      newTitle = generateChatTitle(messages as ChatMessage[]);
    }

    chat = await updateChatSession(id, {
      ...(newTitle !== undefined && { title: newTitle }),
      ...(messages !== undefined && { messages }),
      ...(projectId !== undefined && { projectId }),
    });

    // If appSpec content is provided, create or update the linked AppSpec
    if (appSpec) {
      try {
        const isXml = appSpec.includes('<project_specification>');
        const specName = extractAppName(appSpec);
        const existingSpec = await getAppSpecByChatId(id);
        
        if (existingSpec) {
          await updateAppSpec(existingSpec.id, {
            name: specName,
            content: appSpec,
            format: isXml ? 'xml' : 'markdown',
            appDescription: appDescription || undefined,
          });
        } else {
          await createAppSpec({
            chatId: id,
            userId,
            name: specName,
            projectId: projectId || chat.projectId || undefined,
            content: appSpec,
            format: isXml ? 'xml' : 'markdown',
            appDescription: appDescription || undefined,
          });
        }
      } catch (specError) {
        console.error('Failed to save appSpec with chat:', specError);
        // Don't fail the whole request if spec save fails
      }
    }

    return NextResponse.json({ chat });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

/**
 * DELETE /api/chats/[id]
 * Delete a chat session
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    const chat = await getChatSessionById(id);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteChatSession(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
