/**
 * Project Data Access Helpers
 * ===========================
 */

import { prisma } from '../client.js';
import type { Project } from '@prisma/client';

export interface CreateProjectInput {
  name: string;
  description?: string;
  userId: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export interface ListProjectsOptions {
  userId: string;
  limit?: number;
  offset?: number;
}

/**
 * Create a new project.
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  return prisma.project.create({
    data: input,
  });
}

/**
 * Get a project by ID.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  return prisma.project.findUnique({
    where: { id },
  });
}

/**
 * Get a project by ID with builds.
 */
export async function getProjectWithBuilds(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      builds: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

/**
 * List projects for a user.
 */
export async function listProjects(options: ListProjectsOptions): Promise<Project[]> {
  const { userId, limit = 20, offset = 0 } = options;

  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Count projects for a user.
 */
export async function countProjects(userId: string): Promise<number> {
  return prisma.project.count({
    where: { userId },
  });
}

/**
 * Update a project.
 */
export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  return prisma.project.update({
    where: { id },
    data: input,
  });
}

/**
 * Delete a project.
 */
export async function deleteProject(id: string): Promise<Project> {
  return prisma.project.delete({
    where: { id },
  });
}
