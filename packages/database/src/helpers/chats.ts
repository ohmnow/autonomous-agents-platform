/**
 * Chat Session Data Access Helpers
 * =================================
 */

import { prisma } from '../client.js';
import type { ChatSession, Prisma } from '@prisma/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CreateChatSessionInput {
  userId: string;
  projectId?: string;
  title?: string;
  messages?: ChatMessage[];
}

export interface UpdateChatSessionInput {
  title?: string;
  messages?: ChatMessage[];
  projectId?: string | null;
}

export interface ListChatSessionsOptions {
  userId: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Chat Session Operations
// ============================================================================

/**
 * Create a new chat session.
 */
export async function createChatSession(input: CreateChatSessionInput): Promise<ChatSession> {
  return prisma.chatSession.create({
    data: {
      userId: input.userId,
      projectId: input.projectId,
      title: input.title ?? 'New Chat',
      // Cast messages to JSON-compatible format for Prisma
      messages: (input.messages ?? []) as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Get a chat session by ID.
 */
export async function getChatSessionById(id: string): Promise<ChatSession | null> {
  return prisma.chatSession.findUnique({
    where: { id },
  });
}

/**
 * Get a chat session with related data.
 */
export async function getChatSessionWithRelations(id: string) {
  return prisma.chatSession.findUnique({
    where: { id },
    include: {
      project: true,
      appSpec: true,
    },
  });
}

/**
 * Get a chat session with its linked appSpec.
 */
export async function getChatSessionWithAppSpec(id: string) {
  return prisma.chatSession.findUnique({
    where: { id },
    include: {
      appSpec: true,
    },
  });
}

/**
 * List chat sessions for a user.
 */
export async function listChatSessions(options: ListChatSessionsOptions): Promise<ChatSession[]> {
  const { userId, projectId, limit = 20, offset = 0 } = options;

  return prisma.chatSession.findMany({
    where: {
      userId,
      ...(projectId && { projectId }),
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Count chat sessions for a user.
 */
export async function countChatSessions(userId: string, projectId?: string): Promise<number> {
  return prisma.chatSession.count({
    where: {
      userId,
      ...(projectId && { projectId }),
    },
  });
}

/**
 * Update a chat session.
 */
export async function updateChatSession(
  id: string,
  input: UpdateChatSessionInput
): Promise<ChatSession> {
  // Build the update object conditionally
  const updateData: Prisma.ChatSessionUpdateInput = {};
  
  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.messages !== undefined) {
    updateData.messages = input.messages as unknown as Prisma.InputJsonValue;
  }
  if (input.projectId !== undefined) {
    updateData.project = input.projectId 
      ? { connect: { id: input.projectId } } 
      : { disconnect: true };
  }
  
  return prisma.chatSession.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete a chat session.
 */
export async function deleteChatSession(id: string): Promise<ChatSession> {
  return prisma.chatSession.delete({
    where: { id },
  });
}

/**
 * Generate a title for a chat based on first user message.
 */
export function generateChatTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  // Take first 50 characters of the message
  const content = firstUserMessage.content.trim();
  if (content.length <= 50) return content;
  return content.slice(0, 47) + '...';
}
