import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE, getCookie } from "../security/cookies.js";
import { isDevAuthAllowed } from "../security/httpErrors.js";

export interface AuthedRequest {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthedRequest;
    }
  }
}

function extractBearerToken(req: { headers: { authorization?: string } }): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function resolveUserId(token: string): string | null {
  if (token.startsWith("dev:")) {
    if (!isDevAuthAllowed()) return null;
    const userId = token.slice("dev:".length);
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return null;
    return userId;
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    const sub = decoded.sub;
    if (typeof sub !== "string" || sub.length === 0) return null;
    return sub;
  } catch {
    return null;
  }
}

export const authMiddleware: RequestHandler = (req, res, next) => {
  const cookieToken = getCookie(req, AUTH_COOKIE);
  const bearerToken = extractBearerToken(req);
  const token = cookieToken ?? bearerToken;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const userId = resolveUserId(token);
  if (!userId) {
    if (token.startsWith("dev:") && !isDevAuthAllowed()) {
      return res.status(401).json({ error: "Dev authentication is disabled in production" });
    }
    if (!token.startsWith("dev:") && !process.env.SUPABASE_JWT_SECRET) {
      return res.status(503).json({ error: "Authentication is not configured" });
    }
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.auth = { userId };
  return next();
};
