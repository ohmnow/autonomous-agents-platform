/**
 * Simple in-memory rate limiter
 *
 * For production, consider using Redis or a dedicated rate limiting service.
 * This implementation is suitable for single-server deployments.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// In-memory store for rate limit entries
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (e.g., userId or IP)
 * @param config - Rate limit configuration
 * @returns Object with success flag and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry or entry expired, create new one
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Pre-defined rate limit configurations
export const rateLimits = {
  // API requests: 100 per minute
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  // Chat messages: 60 per hour (for AI calls)
  chat: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 60,
  },
  // Builds: 10 per hour
  builds: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
  // Authentication: 10 per minute
  auth: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
};

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
  };
}

/**
 * Rate limit response for rejected requests
 */
export function rateLimitExceededResponse(
  remaining: number,
  resetTime: number
) {
  return new Response(
    JSON.stringify({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...createRateLimitHeaders(remaining, resetTime),
      },
    }
  );
}
