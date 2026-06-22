import type { Express } from "express";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { authMiddleware } from "./middleware/auth.js";
import { aiLimiter, authLimiter, standardLimiter } from "./middleware/rateLimit.js";
import { registerAssistantRoute } from "./routes/assistantPublic.js";
import { devSessionHandler, meHandler } from "./routes/auth.js";
import { attachIsStandards } from "./routes/isStandards.js";
import { attachNotifications } from "./routes/notifications.js";
import { projectsRouter } from "./routes/projects.js";
import { validateEnv } from "./env.js";

export async function createHttpApp(): Promise<Express> {
  // Fail fast on missing environment variables
  const envCheck = validateEnv();
  if (!envCheck.ok) {
    console.error("[FATAL] Server cannot start due to missing environment variables.");
  }

  const app = express();

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, database: Boolean(process.env.DATABASE_URL) });
  });

  // Rate-limited auth endpoints
  app.post("/api/auth/dev-session", authLimiter, devSessionHandler);

  // Rate-limited AI assistant
  registerAssistantRoute(app);
  app.use("/api/analyze-structure", aiLimiter);

  const api = express.Router();
  api.use(authMiddleware);
  api.use(standardLimiter); // 100 req / 15 min per IP
  api.get("/auth/me", meHandler);
  api.use("/projects", projectsRouter);
  attachIsStandards(api);
  attachNotifications(api);

  app.use("/api", api);

  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
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

  return app;
}
