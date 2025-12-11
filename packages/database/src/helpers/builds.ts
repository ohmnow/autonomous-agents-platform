/**
 * Build Data Access Helpers
 * =========================
 */

import { prisma } from '../client.js';
import type { Build, BuildLog, BuildStatus } from '@prisma/client';

export type ComplexityTier = 'simple' | 'standard' | 'production';

export interface CreateBuildInput {
  userId: string;
  projectId?: string;
  appSpec: string;
  appSpecId?: string;
  harnessId?: string;
  sandboxProvider?: string;
  // Complexity configuration
  complexityTier?: ComplexityTier;
  targetFeatureCount?: number;
  complexityInferred?: boolean;
}

/**
 * Get the default feature count for a complexity tier.
 */
export function getDefaultFeatureCount(tier: ComplexityTier): number {
  switch (tier) {
    case 'simple':
      return 30;
    case 'standard':
      return 80;
    case 'production':
      return 200;
    default:
      return 80;
  }
}

/**
 * Get tier details for UI display.
 */
export function getTierDetails(tier: ComplexityTier) {
  const tiers = {
    simple: {
      name: 'Simple',
      featureRange: '20-40',
      buildTime: '1-4 hours',
      description: 'Landing pages, prototypes, demos, single-feature apps',
    },
    standard: {
      name: 'Standard',
      featureRange: '60-120',
      buildTime: '4-12 hours',
      description: 'Dashboards, blogs, small SaaS, CRUD apps',
    },
    production: {
      name: 'Production',
      featureRange: '150-250+',
      buildTime: '12-48+ hours',
      description: 'Full SaaS, complex apps, Claude.ai clones',
    },
  };
  return tiers[tier] || tiers.standard;
}

export interface UpdateBuildInput {
  sandboxId?: string;
  status?: BuildStatus;
  progress?: object;
  startedAt?: Date;
  completedAt?: Date;
  outputUrl?: string;
  artifactKey?: string;
}

export interface ListBuildsOptions {
  userId?: string;
  projectId?: string;
  status?: BuildStatus;
  limit?: number;
  offset?: number;
}

export interface CreateBuildLogInput {
  buildId: string;
  level: string;
  message: string;
  metadata?: object;
}

// ============================================================================
// Build Operations
// ============================================================================

/**
 * Create a new build.
 */
export async function createBuild(input: CreateBuildInput): Promise<Build> {
  const tier = input.complexityTier ?? 'standard';
  const targetFeatureCount = input.targetFeatureCount ?? getDefaultFeatureCount(tier);
  
  return prisma.build.create({
    data: {
      userId: input.userId,
      projectId: input.projectId,
      appSpecId: input.appSpecId,
      appSpec: input.appSpec,
      harnessId: input.harnessId ?? 'coding',
      sandboxProvider: input.sandboxProvider ?? 'e2b',
      complexityTier: tier,
      targetFeatureCount,
      complexityInferred: input.complexityInferred ?? true,
    },
  });
}

/**
 * Get a build by ID.
 */
export async function getBuildById(id: string): Promise<Build | null> {
  return prisma.build.findUnique({
    where: { id },
  });
}

/**
 * Get a build with logs.
 */
export async function getBuildWithLogs(id: string, logLimit = 100) {
  return prisma.build.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { createdAt: 'desc' },
        take: logLimit,
      },
      project: true,
    },
  });
}

/**
 * List builds with filters.
 */
export async function listBuilds(options: ListBuildsOptions): Promise<Build[]> {
  const { userId, projectId, status, limit = 20, offset = 0 } = options;

  return prisma.build.findMany({
    where: {
      ...(userId && { userId }),
      ...(projectId && { projectId }),
      ...(status && { status }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Count builds with filters.
 */
export async function countBuilds(options: Omit<ListBuildsOptions, 'limit' | 'offset'>): Promise<number> {
  const { userId, projectId, status } = options;

  return prisma.build.count({
    where: {
      ...(userId && { userId }),
      ...(projectId && { projectId }),
      ...(status && { status }),
    },
  });
}

/**
 * Update a build.
 */
export async function updateBuild(id: string, input: UpdateBuildInput): Promise<Build> {
  return prisma.build.update({
    where: { id },
    data: input,
  });
}

/**
 * Delete a build.
 */
export async function deleteBuild(id: string): Promise<Build> {
  return prisma.build.delete({
    where: { id },
  });
}

/**
 * Start a build (update status and startedAt).
 */
export async function startBuild(id: string, sandboxId: string): Promise<Build> {
  return prisma.build.update({
    where: { id },
    data: {
      status: 'INITIALIZING',
      sandboxId,
      startedAt: new Date(),
    },
  });
}

/**
 * Complete a build (update status and completedAt).
 */
export async function completeBuild(
  id: string,
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED',
  options?: { outputUrl?: string; artifactKey?: string }
): Promise<Build> {
  return prisma.build.update({
    where: { id },
    data: {
      status,
      completedAt: new Date(),
      ...(options?.outputUrl && { outputUrl: options.outputUrl }),
      ...(options?.artifactKey && { artifactKey: options.artifactKey }),
    },
  });
}

/**
 * Update build progress.
 */
export async function updateBuildProgress(id: string, progress: object): Promise<Build> {
  return prisma.build.update({
    where: { id },
    data: {
      progress,
      status: 'RUNNING',
    },
  });
}

// ============================================================================
// Build Log Operations
// ============================================================================

/**
 * Create a build log entry.
 */
export async function createBuildLog(input: CreateBuildLogInput): Promise<BuildLog> {
  return prisma.buildLog.create({
    data: input,
  });
}

/**
 * Create multiple build log entries.
 */
export async function createBuildLogs(logs: CreateBuildLogInput[]): Promise<{ count: number }> {
  return prisma.buildLog.createMany({
    data: logs,
  });
}

/**
 * Get logs for a build.
 */
export async function getBuildLogs(
  buildId: string,
  options?: { limit?: number; after?: Date }
): Promise<BuildLog[]> {
  const { limit = 100, after } = options ?? {};

  return prisma.buildLog.findMany({
    where: {
      buildId,
      ...(after && { createdAt: { gt: after } }),
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

/**
 * Delete all logs for a build.
 */
export async function deleteBuildLogs(buildId: string): Promise<{ count: number }> {
  return prisma.buildLog.deleteMany({
    where: { buildId },
  });
}
