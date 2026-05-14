import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

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

export const authMiddleware: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization bearer token" });
  }
  const token = header.slice("Bearer ".length).trim();

  if (token.startsWith("dev:")) {
    const userId = token.slice("dev:".length);
    if (!userId) {
      return res.status(401).json({ error: "Invalid dev token" });
    }
    req.auth = { userId };
    return next();
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (secret) {
    try {
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
      const sub = decoded.sub;
      if (typeof sub === "string" && sub.length > 0) {
        req.auth = { userId: sub };
        return next();
      }
    } catch {
      return res.status(401).json({ error: "Invalid JWT" });
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
};
