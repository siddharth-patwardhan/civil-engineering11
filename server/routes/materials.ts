import { Prisma } from "@prisma/client";
import { safeErrorMessage } from "../security/httpErrors.js";
import { Router } from "express";
import { materialInputSchema } from "../../src/domain/schemas.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const materialsRouter = Router({ mergeParams: true });

materialsRouter.get("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const rows = await prisma.materialMaster.findMany({
      where: { orgId: project.orgId },
      include: { rates: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    res.json({
      materials: rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        category: r.category,
        unit: r.unit,
        spec: r.spec,
        latestRate: r.rates[0] ? Number(r.rates[0].rate) : null,
      })),
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

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
