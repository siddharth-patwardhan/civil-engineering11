import { Prisma } from "@prisma/client";
import { safeErrorMessage } from "../security/httpErrors.js";
import { Router } from "express";
import { materialInputSchema } from "../../src/domain/schemas.js";
import {
  GOVERNMENT_DSR_MATERIAL_BUNDLE,
  parseMaterialTextOrPdf,
  calculateRelativeMaterialCost,
} from "../../src/domain/materialCostEngine.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const materialsRouter = Router({ mergeParams: true });

/** Get all materials for active project org with latest rates */
materialsRouter.get("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const rows = await prisma.materialMaster.findMany({
      where: { orgId: project.orgId },
      include: { rates: { orderBy: { effectiveFrom: "desc" } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    res.json({
      materials: rows.map((r: any) => {
        const sortedRates = r.rates ? [...r.rates].sort((a: any, b: any) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime()) : [];
        const latestRate = sortedRates[0] ? Number(sortedRates[0].rate) : null;
        const baseDsrRate = sortedRates[sortedRates.length - 1] ? Number(sortedRates[sortedRates.length - 1].rate) : latestRate;
        const comp = calculateRelativeMaterialCost({
          baseRate: baseDsrRate ?? 0,
          currentRate: latestRate ?? 0,
        });

        return {
          id: r.id,
          code: r.code,
          name: r.name,
          category: r.category,
          unit: r.unit,
          spec: r.spec,
          latestRate,
          baseRate: baseDsrRate,
          relativeCost: comp,
          rateHistory: sortedRates.map((rt: any) => ({
            id: rt.id,
            rate: Number(rt.rate),
            supplierName: rt.supplierName,
            effectiveFrom: rt.effectiveFrom,
          })),
        };
      }),
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

/** Create material */
materialsRouter.post("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const parsed = materialInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const prisma = requirePrisma();
    const row = await prisma.materialMaster.create({
      data: {
        orgId: project.orgId,
        code: parsed.data.code,
        name: parsed.data.name,
        category: parsed.data.category,
        unit: parsed.data.unit,
        spec: parsed.data.spec,
        ...(parsed.data.rate != null
          ? {
              rates: {
                create: {
                  rate: new Prisma.Decimal(parsed.data.rate),
                  effectiveFrom: new Date(),
                },
              },
            }
          : {}),
      },
    });
    await writeAudit(userId, "material.create", "MaterialMaster", row.id, { name: row.name });
    res.status(201).json({ material: row });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

/** Import Government Schedule of Rates / DSR Bundle */
materialsRouter.post("/import-government", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of GOVERNMENT_DSR_MATERIAL_BUNDLE) {
      const existing = await prisma.materialMaster.findFirst({
        where: { orgId: project.orgId, code: item.code },
      });

      if (existing) {
        await prisma.materialMaster.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            category: item.category,
            unit: item.unit,
            spec: `${item.spec} | Ref: ${item.isStandardRef} (${item.governmentSchedule})`,
          },
        });
        await prisma.materialRate.create({
          data: {
            materialId: existing.id,
            supplierName: item.governmentSchedule,
            rate: new Prisma.Decimal(item.baseRate),
            effectiveFrom: new Date(),
          },
        });
        updatedCount++;
      } else {
        await prisma.materialMaster.create({
          data: {
            orgId: project.orgId,
            code: item.code,
            name: item.name,
            category: item.category,
            unit: item.unit,
            spec: `${item.spec} | Ref: ${item.isStandardRef} (${item.governmentSchedule})`,
            rates: {
              create: {
                supplierName: item.governmentSchedule,
                rate: new Prisma.Decimal(item.baseRate),
                effectiveFrom: new Date(),
              },
            },
          },
        });
        createdCount++;
      }
    }

    await writeAudit(userId, "material.import_government", "MaterialMaster", project.orgId, {
      createdCount,
      updatedCount,
    });

    res.json({
      success: true,
      message: `Imported ${createdCount} new materials and updated ${updatedCount} existing items from CPWD DSR / IS Code schedules.`,
      createdCount,
      updatedCount,
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

/** Import materials from parsed text / PDF document */
materialsRouter.post("/import-pdf", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const { rawText } = req.body as { rawText?: string };

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "rawText parameter is required for PDF/text schedule parsing." });
    }

    const items = parseMaterialTextOrPdf(rawText);
    if (items.length === 0) {
      return res.status(400).json({ error: "No structured material lines were identified in the text. Format example: 'CPWD-3.1 OPC Cement bag 380'" });
    }

    const prisma = requirePrisma();
    let imported = 0;

    for (const item of items) {
      const existing = await prisma.materialMaster.findFirst({
        where: { orgId: project.orgId, code: item.code },
      });

      if (existing) {
        await prisma.materialRate.create({
          data: {
            materialId: existing.id,
            supplierName: item.governmentSchedule ?? "PDF Import",
            rate: new Prisma.Decimal(item.baseRate),
            effectiveFrom: new Date(),
          },
        });
      } else {
        await prisma.materialMaster.create({
          data: {
            orgId: project.orgId,
            code: item.code,
            name: item.name,
            category: item.category,
            unit: item.unit,
            spec: item.spec,
            rates: {
              create: {
                supplierName: item.governmentSchedule ?? "PDF Import",
                rate: new Prisma.Decimal(item.baseRate),
                effectiveFrom: new Date(),
              },
            },
          },
        });
      }
      imported++;
    }

    await writeAudit(userId, "material.import_pdf", "MaterialMaster", project.orgId, {
      imported,
    });

    res.json({
      success: true,
      importedCount: imported,
      items,
      message: `Successfully parsed and imported ${imported} material rates from PDF text.`,
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

/** Batch Rate Adjustment / Location Index Multiplier */
materialsRouter.post("/batch-rate-update", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const { category, percentChange, multiplier, supplierName } = req.body as {
      category?: string;
      percentChange?: number;
      multiplier?: number;
      supplierName?: string;
    };

    const factor = multiplier != null ? multiplier : 1 + (percentChange ?? 0) / 100;
    if (factor <= 0) return res.status(400).json({ error: "Invalid adjustment factor" });

    const prisma = requirePrisma();
    const materials = await prisma.materialMaster.findMany({
      where: {
        orgId: project.orgId,
        ...(category ? { category } : {}),
      },
      include: { rates: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
    });

    let updatedCount = 0;
    for (const mat of materials) {
      const currentRate = mat.rates[0] ? Number(mat.rates[0].rate) : 0;
      if (currentRate > 0) {
        const newRate = Number((currentRate * factor).toFixed(2));
        await prisma.materialRate.create({
          data: {
            materialId: mat.id,
            supplierName: supplierName ?? `Batch Market Adjustment (${factor > 1 ? "+" : ""}${((factor - 1) * 100).toFixed(1)}%)`,
            rate: new Prisma.Decimal(newRate),
            effectiveFrom: new Date(),
          },
        });
        updatedCount++;
      }
    }

    await writeAudit(userId, "material.batch_rate_update", "MaterialMaster", project.orgId, {
      category: category ?? "ALL",
      factor,
      updatedCount,
    });

    res.json({
      success: true,
      updatedCount,
      message: `Updated rates for ${updatedCount} materials with a ${((factor - 1) * 100).toFixed(1)}% market relative factor.`,
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

/** Apply latest material costs to BOQ / Rate Analysis lines */
materialsRouter.post("/apply-to-boq", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();

    // Fetch latest version of BOQ for this project
    const version = await prisma.boqVersion.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
      include: { lines: true },
    });

    if (!version) {
      return res.status(400).json({ error: "No active BOQ version found for this project. Create a BOQ version first." });
    }

    const materials = await prisma.materialMaster.findMany({
      where: { orgId: project.orgId },
      include: { rates: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
    });

    let updatedLinesCount = 0;

    // Loop through BOQ lines, matching descriptions/categories to material rates
    for (const line of version.lines) {
      const lineDescLower = line.description.toLowerCase();
      let matchedMaterial: any = null;

      for (const m of materials) {
        if (lineDescLower.includes(m.name.toLowerCase()) || lineDescLower.includes(m.code.toLowerCase())) {
          matchedMaterial = m;
          break;
        }
      }

      if (matchedMaterial && matchedMaterial.rates[0]) {
        const materialRate = Number(matchedMaterial.rates[0].rate);
        const qty = Number(line.quantity);
        const newRate = materialRate;
        const newAmount = qty * newRate;

        await prisma.boqLine.update({
          where: { id: line.id },
          data: {
            rate: new Prisma.Decimal(newRate),
            amount: new Prisma.Decimal(newAmount),
          },
        });
        updatedLinesCount++;
      }
    }

    await writeAudit(userId, "material.apply_to_boq", "BoqVersion", version.id, {
      updatedLinesCount,
    });

    res.json({
      success: true,
      updatedLinesCount,
      message: `Synchronized latest material rates to ${updatedLinesCount} BOQ item lines.`,
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

/** Update material */
materialsRouter.put("/:materialId", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, materialId } = req.params as { projectId: string; materialId: string };
    const project = await assertProjectAccess(userId, projectId);
    const parsed = materialInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const prisma = requirePrisma();
    const existing = await prisma.materialMaster.findFirst({ where: { id: materialId, orgId: project.orgId } });
    if (!existing) return res.status(404).json({ error: "Material not found" });
    const row = await prisma.materialMaster.update({
      where: { id: materialId },
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        category: parsed.data.category,
        unit: parsed.data.unit,
        spec: parsed.data.spec,
      },
    });
    if (parsed.data.rate != null) {
      await prisma.materialRate.create({
        data: {
          materialId,
          supplierName: req.body?.supplierName ?? "Manual Market Revision",
          rate: new Prisma.Decimal(parsed.data.rate),
          effectiveFrom: new Date(),
        },
      });
    }
    res.json({ material: row });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

/** Delete material */
materialsRouter.delete("/:materialId", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, materialId } = req.params as { projectId: string; materialId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const existing = await prisma.materialMaster.findFirst({ where: { id: materialId, orgId: project.orgId } });
    if (!existing) return res.status(404).json({ error: "Material not found" });
    await prisma.materialMaster.delete({ where: { id: materialId } });
    res.status(204).end();
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});
