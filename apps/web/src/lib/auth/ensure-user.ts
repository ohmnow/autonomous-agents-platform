/**
 * Ensure User Exists
 * ==================
 *
 * Helper to sync Clerk users with our PostgreSQL database.
 * Call this at the start of API routes that need the database user ID.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrCreateUser, getUserByClerkId } from '@repo/database';

interface EnsureUserResult {
  userId: string; // Our database user ID
  clerkId: string; // Clerk's user ID
}

/**
 * Ensures the current Clerk user exists in our database.
 * Returns the database user ID for use in queries.
 *
 * @throws Error if not authenticated
 */
export async function ensureUser(): Promise<EnsureUserResult> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  // Try to get existing user first (fast path)
  const existingUser = await getUserByClerkId(clerkId);
  if (existingUser) {
    return {
      userId: existingUser.id,
      clerkId,
    };
  }

  // User doesn't exist, fetch details from Clerk and create
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error('Could not fetch user from Clerk');
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error('User has no email address');
  }

  const user = await getOrCreateUser({
    clerkId,
    email,
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || undefined,
  });

  return {
    userId: user.id,
    clerkId,
  };
}

/**
 * Gets the database user ID for the current Clerk user.
 * Returns null if not authenticated or user doesn't exist yet.
 * Use this for read-only operations where user creation isn't needed.
 */
export async function getDbUserId(): Promise<string | null> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  const user = await getUserByClerkId(clerkId);
  return user?.id ?? null;
}
