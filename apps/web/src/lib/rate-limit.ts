// Simple in-memory rate limiter for Edge runtime
// For production, use Redis-based rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.resetAt < now) {
      cache.delete(key);
    }
  }
}, 60000);

export interface RateLimitConfig {
  interval: number; // in milliseconds
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    cache.set(key, {
      count: 1,
      resetAt: now + config.interval,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.interval,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Pre-configured rate limiters
export const authRateLimit = {
  signin: { interval: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min
  signup: { interval: 60 * 60 * 1000, maxRequests: 3 }, // 3 signups per hour
  forgotPassword: { interval: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
  refresh: { interval: 60 * 1000, maxRequests: 10 }, // 10 per minute
};

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}
