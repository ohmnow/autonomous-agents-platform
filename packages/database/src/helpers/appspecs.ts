/**
 * App Spec Data Access Helpers
 * ============================
 */

import { prisma } from '../client.js';
import type { AppSpec } from '@prisma/client';

export type AppSpecFormat = 'xml' | 'markdown';

export interface CreateAppSpecInput {
  userId: string;
  name: string;
  content: string;
  projectId?: string;
  chatId?: string;
  format?: AppSpecFormat;
  appDescription?: string;  // Intermediate format from Stage 1 (Discovery)
}

export interface UpdateAppSpecInput {
  name?: string;
  content?: string;
  projectId?: string | null;
  format?: AppSpecFormat;
  appDescription?: string | null;
}

export interface ListAppSpecsOptions {
  userId: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// App Spec Operations
// ============================================================================

/**
 * Create a new app spec.
 */
export async function createAppSpec(input: CreateAppSpecInput): Promise<AppSpec> {
  return prisma.appSpec.create({
    data: {
      userId: input.userId,
      name: input.name,
      content: input.content,
      projectId: input.projectId,
      chatId: input.chatId,
      format: input.format ?? 'markdown',
      appDescription: input.appDescription,
    },
  });
}

/**
 * Get an app spec by ID.
 */
export async function getAppSpecById(id: string): Promise<AppSpec | null> {
  return prisma.appSpec.findUnique({
    where: { id },
  });
}

/**
 * Get an app spec by chat ID.
 */
export async function getAppSpecByChatId(chatId: string): Promise<AppSpec | null> {
  return prisma.appSpec.findUnique({
    where: { chatId },
  });
}

/**
 * Get an app spec with related data.
 */
export async function getAppSpecWithRelations(id: string) {
  return prisma.appSpec.findUnique({
    where: { id },
    include: {
      project: true,
      chat: true,
      builds: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
}

/**
 * List app specs for a user.
 */
export async function listAppSpecs(options: ListAppSpecsOptions): Promise<AppSpec[]> {
  const { userId, projectId, limit = 20, offset = 0 } = options;

  return prisma.appSpec.findMany({
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
 * Count app specs for a user.
 */
export async function countAppSpecs(userId: string, projectId?: string): Promise<number> {
  return prisma.appSpec.count({
    where: {
      userId,
      ...(projectId && { projectId }),
    },
  });
}

/**
 * Update an app spec.
 */
export async function updateAppSpec(id: string, input: UpdateAppSpecInput): Promise<AppSpec> {
  return prisma.appSpec.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.projectId !== undefined && { projectId: input.projectId }),
      ...(input.format !== undefined && { format: input.format }),
      ...(input.appDescription !== undefined && { appDescription: input.appDescription }),
    },
  });
}

/**
 * Delete an app spec.
 */
export async function deleteAppSpec(id: string): Promise<AppSpec> {
  return prisma.appSpec.delete({
    where: { id },
  });
}

/**
 * Extract app name from spec content.
 * Supports both XML (<project_name>) and Markdown (# Title) formats.
 */
export function extractAppName(content: string): string {
  // Try XML format first: <project_name>...</project_name>
  const xmlMatch = content.match(/<project_name>\s*([^<]+)\s*<\/project_name>/);
  if (xmlMatch) {
    return xmlMatch[1].trim();
  }
  
  // Fall back to markdown title: # App Name
  const mdMatch = content.match(/^#\s+(.+)$/m);
  if (mdMatch) {
    return mdMatch[1].trim();
  }
  
  return 'Untitled App';
}

/**
 * Extract complexity tier from XML spec content.
 */
export function extractComplexityFromSpec(content: string): { 
  tier: 'simple' | 'standard' | 'production'; 
  targetFeatures: number;
} | null {
  // Try XML format: <complexity_tier>...</complexity_tier>
  const tierMatch = content.match(/<complexity_tier>\s*(simple|standard|production)\s*<\/complexity_tier>/);
  const featuresMatch = content.match(/<target_features>\s*(\d+)\s*<\/target_features>/);
  
  if (tierMatch) {
    const tier = tierMatch[1] as 'simple' | 'standard' | 'production';
    const targetFeatures = featuresMatch ? parseInt(featuresMatch[1], 10) : getDefaultForTier(tier);
    return { tier, targetFeatures };
  }
  
  return null;
}

function getDefaultForTier(tier: 'simple' | 'standard' | 'production'): number {
  switch (tier) {
    case 'simple': return 30;
    case 'standard': return 80;
    case 'production': return 200;
    default: return 80;
  }
}
