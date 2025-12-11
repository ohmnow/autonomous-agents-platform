/**
 * Build Event Data Access Helpers
 * ================================
 * 
 * Helpers for persisting and retrieving structured agent events.
 */

import { prisma } from '../client.js';
import type { BuildEvent, Prisma } from '@prisma/client';

export interface CreateBuildEventInput {
  buildId: string;
  type: string;
  data: Record<string, unknown>;
}

export interface ListBuildEventsOptions {
  buildId: string;
  types?: string[];
  limit?: number;
  offset?: number;
  after?: Date;
}

// ============================================================================
// Build Event Operations
// ============================================================================

/**
 * Create a single build event.
 */
export async function createBuildEvent(input: CreateBuildEventInput): Promise<BuildEvent> {
  return prisma.buildEvent.create({
    data: {
      buildId: input.buildId,
      type: input.type,
      data: input.data as Prisma.JsonObject,
    },
  });
}

/**
 * Create multiple build events in a batch.
 * Returns the count of created events.
 */
export async function createBuildEventsBatch(
  events: CreateBuildEventInput[]
): Promise<{ count: number }> {
  return prisma.buildEvent.createMany({
    data: events.map((event) => ({
      buildId: event.buildId,
      type: event.type,
      data: event.data as Prisma.JsonObject,
    })),
  });
}

/**
 * Get events for a build with optional filtering.
 */
export async function getBuildEvents(
  options: ListBuildEventsOptions
): Promise<BuildEvent[]> {
  const { buildId, types, limit = 1000, offset = 0, after } = options;

  return prisma.buildEvent.findMany({
    where: {
      buildId,
      ...(types && types.length > 0 && { type: { in: types } }),
      ...(after && { createdAt: { gt: after } }),
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Get events for a build by type.
 */
export async function getBuildEventsByType(
  buildId: string,
  type: string,
  limit?: number
): Promise<BuildEvent[]> {
  return prisma.buildEvent.findMany({
    where: {
      buildId,
      type,
    },
    orderBy: { createdAt: 'asc' },
    ...(limit && { take: limit }),
  });
}

/**
 * Count events for a build with optional type filter.
 */
export async function countBuildEvents(
  buildId: string,
  types?: string[]
): Promise<number> {
  return prisma.buildEvent.count({
    where: {
      buildId,
      ...(types && types.length > 0 && { type: { in: types } }),
    },
  });
}

/**
 * Delete all events for a build.
 */
export async function deleteBuildEvents(buildId: string): Promise<{ count: number }> {
  return prisma.buildEvent.deleteMany({
    where: { buildId },
  });
}

/**
 * Get the latest event of a specific type for a build.
 */
export async function getLatestBuildEvent(
  buildId: string,
  type?: string
): Promise<BuildEvent | null> {
  return prisma.buildEvent.findFirst({
    where: {
      buildId,
      ...(type && { type }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get event type summary for a build.
 * Returns counts grouped by event type.
 */
export async function getBuildEventTypeSummary(
  buildId: string
): Promise<Array<{ type: string; count: number }>> {
  const result = await prisma.buildEvent.groupBy({
    by: ['type'],
    where: { buildId },
    _count: { type: true },
  });

  return result.map((r) => ({
    type: r.type,
    count: r._count.type,
  }));
}
