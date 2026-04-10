/**
 * Rate limiting utilities for API endpoints.
 * Uses in-memory token bucket algorithm for simplicity.
 * For production, consider Redis-based rate limiting (@upstash/ratelimit).
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the current window */
  remaining: number;
  /** Time when the rate limit window resets (Unix timestamp in ms) */
  resetTime: number;
}

/**
 * Simple in-memory rate limiter.
 * NOTE: This is per-process. For multi-instance deployments, use Redis-based limiting.
 */
class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  private config: RateLimitConfig;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    
    // Clean up on process exit (for serverless)
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.destroy());
      process.on('SIGTERM', () => this.destroy());
      process.on('SIGINT', () => this.destroy());
    }
  }

  /**
   * Clean up the interval timer to prevent memory leaks.
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }

  /**
   * Check if a request is allowed based on rate limits.
   * @param key Unique identifier (e.g., IP address, user ID)
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(key);

    // If no record or window expired, allow request
    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    // Check if within limit
    if (record.count < this.config.maxRequests) {
      record.count += 1;
      return {
        allowed: true,
        remaining: this.config.maxRequests - record.count,
        resetTime: record.resetTime,
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  /**
   * Remove expired entries to prevent memory leaks.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Rate limiter for video analysis endpoints.
 * Allows 10 requests per minute per IP.
 */
export const analysisRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Rate limiter for pipeline endpoints (full video processing).
 * Allows 5 requests per minute per IP (more expensive operation).
 */
export const pipelineRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Rate limiter for code generation endpoints.
 * Allows 10 requests per minute per IP.
 */
export const codeGenRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Rate limiter for editor chat endpoints.
 * Allows 20 requests per minute per IP.
 */
export const chatRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Extract client IP address from request headers.
 * Handles various proxy configurations (Vercel, Cloudflare, etc.).
 */
export function getClientIp(headers: Headers): string {
  // Check common headers for IP (in order of preference)
  const ipHeaders = [
    'x-real-ip',
    'x-forwarded-for',
    'cf-connecting-ip', // Cloudflare
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain comma-separated list, take first
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }

  // Use socket address as fallback if available
  // Return a unique identifier per-request to avoid sharing rate limits
  return `anonymous-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper to create rate-limited API route handlers.
 * Returns a 429 response if rate limit is exceeded.
 */
export function createRateLimitResponse(remaining: number, resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(remaining),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetTime),
        'Retry-After': String(retryAfter),
      },
    }
  );
}
