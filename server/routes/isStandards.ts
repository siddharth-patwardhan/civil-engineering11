import type { Router } from "express";
import { requirePrisma } from "../db.js";

export function attachIsStandards(api: Router) {
  api.get("/is-standards", async (req, res) => {
    try {
      const prisma = requirePrisma();
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const rows = await prisma.isStandard.findMany({
        where: category ? { category } : undefined,
        orderBy: [{ code: "asc" }, { section: "asc" }],
        take: 500,
      });
      res.json({ standards: rows });
    } catch (e) {
      res.status(503).json({ error: String(e) });
    }
  });
}
