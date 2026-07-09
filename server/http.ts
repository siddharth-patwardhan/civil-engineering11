import type { Express } from "express";
import { createHttpApp } from "./createApp.js";
import { startSixDayCron } from "./cron/scheduler.js";

const PORT = Number(process.env.PORT) || 3000;

export async function startHttpServer(): Promise<Express> {
  const app = await createHttpApp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startSixDayCron();
  });
  return app;
}
