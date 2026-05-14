import type { Express } from "express";
import express from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { authMiddleware } from "./middleware/auth.js";
import { registerAssistantRoute } from "./routes/assistantPublic.js";
import { devSessionHandler, meHandler } from "./routes/auth.js";
import { attachIsStandards } from "./routes/isStandards.js";
import { attachNotifications } from "./routes/notifications.js";
import { projectsRouter } from "./routes/projects.js";

export async function createHttpApp(): Promise<Express> {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, database: Boolean(process.env.DATABASE_URL) });
  });

  app.post("/api/auth/dev-session", devSessionHandler);
  registerAssistantRoute(app);

  const api = express.Router();
  api.use(authMiddleware);
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
