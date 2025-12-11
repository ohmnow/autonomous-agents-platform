/**
 * User Data Access Helpers
 * ========================
 */

import { prisma } from '../client.js';
import type { User } from '@prisma/client';

export interface CreateUserInput {
  clerkId: string;
  email: string;
  name?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
}

/**
 * Create a new user.
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  return prisma.user.create({
    data: input,
  });
}

/**
 * Get a user by ID.
 */
export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

/**
 * Get a user by Clerk ID.
 */
export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { clerkId },
  });
}

/**
 * Get a user by email.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Update a user.
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: input,
  });
}

/**
 * Delete a user.
 */
export async function deleteUser(id: string): Promise<User> {
  return prisma.user.delete({
    where: { id },
  });
}

/**
 * Get or create a user by Clerk ID.
 */
export async function getOrCreateUser(input: CreateUserInput): Promise<User> {
  const existing = await getUserByClerkId(input.clerkId);
  if (existing) {
    return existing;
  }
  return createUser(input);
}
