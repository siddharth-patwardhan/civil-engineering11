import type { RequestHandler } from "express";
import { CSRF_COOKIE, getCookie } from "../security/cookies.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Double-submit cookie CSRF check for cookie-authenticated sessions.
 * Bearer-only API clients skip CSRF when no auth cookie is present.
 */
export const csrfMiddleware: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const authCookie = getCookie(req, "cep_auth");
  if (!authCookie) return next();

  const cookieToken = getCookie(req, CSRF_COOKIE);
  const headerToken = req.headers["x-csrf-token"];
  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    cookieToken.length === 0 ||
    cookieToken !== headerToken
  ) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next();
};
