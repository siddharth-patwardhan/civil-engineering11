import { rateLimit } from "express-rate-limit";

/**
 * Standard API rate limiter — 100 requests per 15 minutes per IP.
 * Applied to all /api routes after auth.
 */
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

/**
 * Stricter limiter for auth endpoints — 10 requests per 15 minutes per IP.
 * Prevents brute force on login and password reset.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

/**
 * Limiter for AI assistant — 20 requests per 15 minutes per IP.
 * Gemini API costs can accumulate quickly.
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI assistant rate limit exceeded. Please try again later." },
});
