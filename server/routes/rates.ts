import { Router } from "express";
import { computeRateBreakdown } from "../../src/domain/rateEngine.js";
import type { RateBreakdownInput } from "../../src/domain/rateEngine.js";
import { rateAnalysisInputSchema } from "../../src/domain/schemas.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const ratesRouter = Router({ mergeParams: true });

ratesRouter.get("/books", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const books = await prisma.rateBook.findMany({
      where: { orgId: project.orgId },
      orderBy: { effectiveFrom: "desc" },
      include: { items: true },
    });
    res.json({
      books: books.map((b) => ({
        id: b.id,
        name: b.name,
        effectiveFrom: b.effectiveFrom,
        effectiveTo: b.effectiveTo,
        items: b.items.map((i) => ({
          id: i.id,
          code: i.code,
          description: i.description,
          unit: i.unit,
          rate: Number(i.rate),
        })),
      })),
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: String(e) });
  }
});

ratesRouter.get("/analyses", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const rows = await prisma.rateAnalysis.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      analyses: rows.map((r) => ({
        id: r.id,
        name: r.name,
        materialCost: Number(r.materialCost),
        labourCost: Number(r.labourCost),
        equipmentCost: Number(r.equipmentCost),
        overheadPct: r.overheadPct != null ? Number(r.overheadPct) : null,
        profitPct: r.profitPct != null ? Number(r.profitPct) : null,
        totalRate: Number(r.totalRate),
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: String(e) });
  }
});

ratesRouter.post("/analyses", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    await assertProjectAccess(userId, projectId);
    const parsed = rateAnalysisInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, ...costs } = parsed.data;
    const breakdown = computeRateBreakdown(costs as RateBreakdownInput);
    const prisma = requirePrisma();
    const row = await prisma.rateAnalysis.create({
      data: {
        projectId,
        name,
        materialCost: breakdown.materialCost,
        labourCost: breakdown.labourCost,
        equipmentCost: breakdown.equipmentCost,
        overheadPct: breakdown.overheadPct,
        profitPct: breakdown.profitPct,
        totalRate: breakdown.totalRate,
      },
    });
    await writeAudit(userId, "rate.analysis.create", "RateAnalysis", row.id, {
      totalRate: breakdown.totalRate,
    });
    res.status(201).json({ analysis: { ...breakdown, id: row.id } });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: String(e) });
  }
});
