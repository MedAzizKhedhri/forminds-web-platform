import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Custom key generator for Railway: extract real IP from X-Forwarded-For
const keyGenerator = (req: any) => {
  const xForwardedFor = req.get('X-Forwarded-For');
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs; use the first one (original client IP)
    return xForwardedFor.split(',')[0].trim();
  }
  return req.ip;
};

/**
 * Global rate limiter: 100 requests per 15 minutes per IP (unlimited in dev).
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: (req: any) => isDev,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP (100 in dev).
 * Applied to authentication endpoints (login, register, etc.).
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: (req: any) => isDev,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

/**
 * Password reset rate limiter: 3 requests per hour per IP (50 in dev).
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 50 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: (req: any) => isDev,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in an hour.',
  },
});
