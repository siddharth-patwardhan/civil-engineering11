import { Prisma } from "@prisma/client";
import { safeErrorMessage } from "../security/httpErrors.js";
import { Router } from "express";
import { labourInputSchema } from "../../src/domain/schemas.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const labourRouter = Router({ mergeParams: true });

labourRouter.get("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const rows = await prisma.labourCategory.findMany({
      where: { orgId: project.orgId },
      orderBy: [{ skillLevel: "asc" }, { name: "asc" }],
    });
    res.json({
      labour: rows.map((r) => ({
        id: r.id,
        name: r.name,
        dailyRate: Number(r.dailyRate),
        unit: r.unit,
        skillLevel: r.skillLevel,
        productivityUnit: r.productivityUnit,
        productivityRate: r.productivityRate != null ? Number(r.productivityRate) : null,
      })),
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

labourRouter.post("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const parsed = labourInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const prisma = requirePrisma();
    const row = await prisma.labourCategory.create({
      data: {
        orgId: project.orgId,
        name: parsed.data.name,
        dailyRate: new Prisma.Decimal(parsed.data.dailyRate),
        unit: parsed.data.unit,
        skillLevel: parsed.data.skillLevel,
        productivityUnit: parsed.data.productivityUnit,
        productivityRate:
          parsed.data.productivityRate != null
            ? new Prisma.Decimal(parsed.data.productivityRate)
            : undefined,
      },
    });
    await writeAudit(userId, "labour.create", "LabourCategory", row.id, { name: row.name });
    res.status(201).json({ labour: row });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

labourRouter.put("/:labourId", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, labourId } = req.params as { projectId: string; labourId: string };
    const project = await assertProjectAccess(userId, projectId);
    const parsed = labourInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const prisma = requirePrisma();
    const existing = await prisma.labourCategory.findFirst({ where: { id: labourId, orgId: project.orgId } });
    if (!existing) return res.status(404).json({ error: "Labour category not found" });
    const row = await prisma.labourCategory.update({
      where: { id: labourId },
      data: {
        name: parsed.data.name,
        dailyRate: new Prisma.Decimal(parsed.data.dailyRate),
        unit: parsed.data.unit,
        skillLevel: parsed.data.skillLevel,
        productivityUnit: parsed.data.productivityUnit,
        productivityRate:
          parsed.data.productivityRate != null
            ? new Prisma.Decimal(parsed.data.productivityRate)
            : null,
      },
    });
    res.json({ labour: row });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

labourRouter.delete("/:labourId", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, labourId } = req.params as { projectId: string; labourId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const existing = await prisma.labourCategory.findFirst({ where: { id: labourId, orgId: project.orgId } });
    if (!existing) return res.status(404).json({ error: "Labour category not found" });
    await prisma.labourCategory.delete({ where: { id: labourId } });
    res.status(204).end();
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});
