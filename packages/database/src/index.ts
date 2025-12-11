/**
 * Database Package
 * ================
 *
 * Prisma client and data access helpers for the autonomous agents platform.
 *
 * @packageDocumentation
 */

// Prisma client
export { prisma, PrismaClient } from './client.js';

// Data access helpers
export * from './helpers/users.js';
export * from './helpers/projects.js';
export * from './helpers/builds.js';
export * from './helpers/chats.js';
export * from './helpers/appspecs.js';
export * from './helpers/events.js';

// Re-export types from helpers
export type { ChatMessage } from './helpers/chats.js';
export type { ComplexityTier } from './helpers/builds.js';
export type { AppSpecFormat } from './helpers/appspecs.js';

// Note: Prisma types (User, Project, Build, BuildLog, BuildStatus, ChatSession, AppSpec)
// are exported from @prisma/client after running `pnpm db:generate`. Import them directly:
// import type { User, Build, ChatSession, AppSpec, ... } from '@prisma/client';
