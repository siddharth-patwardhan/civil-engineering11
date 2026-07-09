import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { authMiddleware } from "./middleware/auth.js";
import { csrfMiddleware } from "./middleware/csrf.js";
import { aiLimiter, authLimiter, standardLimiter } from "./middleware/rateLimit.js";
import { attachIsStandards } from "./routes/isStandards.js";
import { attachNotifications } from "./routes/notifications.js";
import { attachDashboard } from "./routes/dashboard.js";
import { projectsRouter } from "./routes/projects.js";
import {
  devSessionHandler,
  logoutHandler,
  meHandler,
  orgGetHandler,
  orgPatchHandler,
  sessionHandler,
  setupHandler,
  signInHandler,
} from "./routes/auth.js";
import { analyzeStructureHandler } from "./routes/assistantPublic.js";
import { validateEnv } from "./env.js";
import { safeErrorMessage } from "./security/httpErrors.js";
import { getCronHealth } from "./cron/scheduler.js";

export async function createHttpApp(): Promise<Express> {
  const envCheck = validateEnv();
  if (!envCheck.ok) {
    console.error("[FATAL] Server cannot start due to missing environment variables.");
  }

  const app = express();
  app.disable("x-powered-by");

  const isProd = process.env.NODE_ENV === "production";

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "256kb", parameterLimit: 50 }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      database: Boolean(process.env.DATABASE_URL),
      cron: getCronHealth(),
    });
  });

  app.post("/api/auth/sign-in", authLimiter, signInHandler);
  app.post("/api/auth/dev-session", authLimiter, devSessionHandler);
  app.post("/api/auth/logout", logoutHandler);

  const api = express.Router();
  api.use(authMiddleware);
  api.use(csrfMiddleware);
  api.use(standardLimiter);
  api.get("/auth/session", sessionHandler);
  api.get("/auth/me", meHandler);
  api.post("/auth/setup", setupHandler);
  api.get("/organization", orgGetHandler);
  api.patch("/organization", orgPatchHandler);
  api.post("/analyze-structure", aiLimiter, analyzeStructureHandler);
  api.use("/projects", projectsRouter);
  attachIsStandards(api);
  attachNotifications(api);
  attachDashboard(api);

  app.use("/api", api);

  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { dotfiles: "deny", index: false }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({ error: safeErrorMessage(err) });
  });

  return app;
}
