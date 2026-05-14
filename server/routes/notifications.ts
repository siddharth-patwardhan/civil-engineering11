import type { Router } from "express";
import { requirePrisma } from "../db.js";

export function attachNotifications(api: Router) {
  api.get("/notifications", async (req, res) => {
    try {
      const prisma = requirePrisma();
      const userId = req.auth!.userId;
      const list = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json({ notifications: list });
    } catch (e) {
      res.status(503).json({ error: String(e) });
    }
  });

  api.patch("/notifications/:id/read", async (req, res) => {
    try {
      const prisma = requirePrisma();
      const userId = req.auth!.userId;
      const updated = await prisma.notification.updateMany({
        where: { id: req.params.id, userId },
        data: { read: true },
      });
      if (updated.count === 0) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({ ok: true });
    } catch (e) {
      res.status(503).json({ error: String(e) });
    }
  });
}
