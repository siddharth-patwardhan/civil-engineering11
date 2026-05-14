import type { Express } from "express";
import { createHttpApp } from "./createApp.js";

const PORT = Number(process.env.PORT) || 3000;

export async function startHttpServer(): Promise<Express> {
  const app = await createHttpApp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  return app;
}
