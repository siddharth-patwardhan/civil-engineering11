import { Prisma } from "@prisma/client";
import { safeErrorMessage } from "../security/httpErrors.js";
import { Router } from "express";
import { equipmentInputSchema } from "../../src/domain/schemas.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const equipmentRouter = Router({ mergeParams: true });

equipmentRouter.get("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const rows = await prisma.equipmentMaster.findMany({
      where: { orgId: project.orgId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    res.json({
      equipment: rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        rentalRate: Number(r.rentalRate),
        unit: r.unit,
        capacity: r.capacity,
      })),
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

equipmentRouter.post("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    const project = await assertProjectAccess(userId, projectId);
    const parsed = equipmentInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const prisma = requirePrisma();
    const row = await prisma.equipmentMaster.create({
      data: {
        orgId: project.orgId,
        name: parsed.data.name,
        category: parsed.data.category,
        rentalRate: new Prisma.Decimal(parsed.data.rentalRate),
        unit: parsed.data.unit,
        capacity: parsed.data.capacity,
      },
    });
    await writeAudit(userId, "equipment.create", "EquipmentMaster", row.id, { name: row.name });
    res.status(201).json({
      equipment: {
        id: row.id,
        name: row.name,
        category: row.category,
        rentalRate: Number(row.rentalRate),
        unit: row.unit,
        capacity: row.capacity,
      },
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

equipmentRouter.put("/:equipmentId", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, equipmentId } = req.params as { projectId: string; equipmentId: string };
    const project = await assertProjectAccess(userId, projectId);
    const parsed = equipmentInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const prisma = requirePrisma();
    const existing = await prisma.equipmentMaster.findFirst({
      where: { id: equipmentId, orgId: project.orgId },
    });
    if (!existing) return res.status(404).json({ error: "Equipment not found" });

    const row = await prisma.equipmentMaster.update({
      where: { id: equipmentId },
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        rentalRate: new Prisma.Decimal(parsed.data.rentalRate),
        unit: parsed.data.unit,
        capacity: parsed.data.capacity,
      },
    });
    await writeAudit(userId, "equipment.update", "EquipmentMaster", row.id, { name: row.name });
    res.json({
      equipment: {
        id: row.id,
        name: row.name,
        category: row.category,
        rentalRate: Number(row.rentalRate),
        unit: row.unit,
        capacity: row.capacity,
      },
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

equipmentRouter.delete("/:equipmentId", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, equipmentId } = req.params as { projectId: string; equipmentId: string };
    const project = await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const existing = await prisma.equipmentMaster.findFirst({
      where: { id: equipmentId, orgId: project.orgId },
    });
    if (!existing) return res.status(404).json({ error: "Equipment not found" });

    await prisma.equipmentMaster.delete({ where: { id: equipmentId } });
    await writeAudit(userId, "equipment.delete", "EquipmentMaster", equipmentId, {});
    res.status(204).end();
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});
