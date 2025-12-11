/**
 * Prisma Client
 * =============
 *
 * Singleton Prisma client instance for database access.
 */

import { PrismaClient } from '@prisma/client';

// PrismaClient singleton
declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client instance.
 * Uses global variable to prevent multiple instances in development.
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Re-export PrismaClient for type usage
export { PrismaClient } from '@prisma/client';
