import { Prisma } from "@prisma/client";
import { safeErrorMessage } from "../security/httpErrors.js";
import { Router } from "express";
import { computeRateBreakdown } from "../../src/domain/rateEngine.js";
import type { RateBreakdownInput } from "../../src/domain/rateEngine.js";
import { boqApplyRateSchema, rateAnalysisInputSchema } from "../../src/domain/schemas.js";
import { boqLineAfterRateUpdate } from "../../src/domain/rateSync.js";
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
    res.status(status).json({ error: safeErrorMessage(e) });
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
        boqLineId: r.boqLineId,
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
    res.status(status).json({ error: safeErrorMessage(e) });
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
    const { name, boqLineId, ...costs } = parsed.data;
    const breakdown = computeRateBreakdown(costs as RateBreakdownInput);
    const prisma = requirePrisma();

    const row = await prisma.$transaction(async (tx) => {
      const analysis = await tx.rateAnalysis.create({
        data: {
          projectId,
          name,
          boqLineId: boqLineId ?? null,
          materialCost: breakdown.materialCost,
          labourCost: breakdown.labourCost,
          equipmentCost: breakdown.equipmentCost,
          overheadPct: breakdown.overheadPct,
          profitPct: breakdown.profitPct,
          totalRate: breakdown.totalRate,
        },
      });

      if (boqLineId) {
        const line = await tx.boqLine.findFirst({
          where: { id: boqLineId, boqVersion: { projectId } },
        });
        if (line) {
          const updated = boqLineAfterRateUpdate(
            { quantity: Number(line.quantity), rate: Number(line.rate) },
            breakdown.totalRate,
          );
          await tx.boqLine.update({
            where: { id: boqLineId },
            data: {
              rate: new Prisma.Decimal(updated.rate),
              amount: new Prisma.Decimal(updated.amount),
            },
          });
        }
      }

      return analysis;
    });

    await writeAudit(userId, "rate.analysis.create", "RateAnalysis", row.id, {
      totalRate: breakdown.totalRate,
      boqLineId: boqLineId ?? null,
    });
    res.status(201).json({ analysis: { ...breakdown, id: row.id, boqLineId: row.boqLineId } });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

/** Apply a rate-book item rate directly to a BOQ line. */
ratesRouter.post("/apply-book-rate", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const parsed = boqApplyRateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const prisma = requirePrisma();
    const [line, item] = await Promise.all([
      prisma.boqLine.findFirst({
        where: { id: parsed.data.boqLineId, boqVersion: { projectId } },
      }),
      prisma.rateBookItem.findFirst({
        where: { id: parsed.data.rateBookItemId, rateBook: { orgId: project.orgId } },
      }),
    ]);
    if (!line) return res.status(404).json({ error: "BOQ line not found" });
    if (!item) return res.status(404).json({ error: "Rate book item not found" });

    const rate = Number(item.rate);
    const updated = boqLineAfterRateUpdate({ quantity: Number(line.quantity), rate }, rate);
    const result = await prisma.boqLine.update({
      where: { id: line.id },
      data: {
        rate: new Prisma.Decimal(updated.rate),
        amount: new Prisma.Decimal(updated.amount),
      },
    });

    res.json({
      line: {
        id: result.id,
        itemNo: result.itemNo,
        description: result.description,
        unit: result.unit,
        quantity: Number(result.quantity),
        rate: Number(result.rate),
        amount: Number(result.amount),
      },
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});
