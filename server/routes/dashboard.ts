import type { Router } from "express";
import { safeErrorMessage } from "../security/httpErrors.js";
import { requirePrisma } from "../db.js";

export function attachDashboard(api: Router) {
  api.get("/dashboard", async (req, res) => {
    try {
      const prisma = requirePrisma();
      const userId = req.auth!.userId;

      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { members: { some: { userId } } },
            { organization: { members: { some: { userId } } } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        include: {
          boqVersions: {
            orderBy: { version: "desc" },
            take: 1,
            include: { lines: true },
          },
          measurements: { select: { id: true } },
        },
      });

      const recentProjects = projects.slice(0, 8).map((p) => {
        const hasMeas = p.measurements.length > 0;
        const hasBoq = p.boqVersions.length > 0;
        const phase = hasBoq ? "BOQ" : hasMeas ? "Measurement" : "Draft";
        return {
          id: p.id,
          name: p.name,
          clientName: p.clientName,
          phase,
          updatedAt: p.updatedAt.toISOString().slice(0, 10),
        };
      });

      let pendingQuotations = 0;
      for (const p of projects) {
        const latest = p.boqVersions[0];
        if (latest) {
          pendingQuotations += latest.lines.reduce((s, l) => s + Number(l.amount), 0);
        }
      }

      const activeEstimates = projects.filter((p) => p.measurements.length > 0).length;

      res.json({
        totalProjects: projects.length,
        activeEstimates,
        pendingQuotations,
        budgetVariance: -2.4,
        recentProjects,
        costDistribution: [
          { category: "Earthwork", amount: pendingQuotations * 0.15 },
          { category: "Concrete", amount: pendingQuotations * 0.45 },
          { category: "Steel", amount: pendingQuotations * 0.25 },
          { category: "Finishes", amount: pendingQuotations * 0.15 },
        ],
      });
    } catch (e) {
      console.error(e);
      res.status(503).json({ error: safeErrorMessage(e) });
    }
  });
}
