import { Prisma } from "@prisma/client";
import { safeErrorMessage } from "../security/httpErrors.js";
import { Router } from "express";
import { projectCreateSchema } from "../../src/domain/schemas.js";
import { validateProjectId } from "../middleware/validateParams.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";
import { measurementsRouter } from "./measurements.js";
import { boqRouter } from "./boq.js";
import { ratesRouter } from "./rates.js";
import { drawingsRouter } from "./drawings.js";
import { approvalsRouter } from "./approvals.js";
import { reportsRouter } from "./reports.js";
import { equipmentRouter } from "./equipment.js";
import { materialsRouter } from "./materials.js";
import { labourRouter } from "./labour.js";

export const projectsRouter = Router();

projectsRouter.use("/:projectId", validateProjectId);

projectsRouter.get("/", async (req, res) => {
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
      select: {
        id: true,
        name: true,
        clientName: true,
        location: true,
        updatedAt: true,
      },
    });
    res.json({ projects });
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: safeErrorMessage(e) });
  }
});

projectsRouter.post("/", async (req, res) => {
  try {
    const parsed = projectCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const prisma = requirePrisma();
    const userId = req.auth!.userId;
    const org = await prisma.organization.findFirst({
      where: { members: { some: { userId } } },
    });
    if (!org) {
      return res.status(400).json({ error: "No organization for user" });
    }
    const project = await prisma.project.create({
      data: {
        orgId: org.id,
        name: parsed.data.name,
        clientName: parsed.data.clientName,
        location: parsed.data.location,
        tenderNumber: parsed.data.tenderNumber,
        structureType: parsed.data.structureType,
        budgetEstimate:
          parsed.data.budgetEstimate != null
            ? new Prisma.Decimal(parsed.data.budgetEstimate)
            : undefined,
        isStandardsVersion: parsed.data.isStandardsVersion,
      },
    });
    await prisma.projectMember.create({
      data: { projectId: project.id, userId, role: "OWNER" },
    });
    await writeAudit(userId, "project.create", "Project", project.id, {
      name: project.name,
    });
    res.status(201).json({ project });
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: safeErrorMessage(e) });
  }
});

projectsRouter.use("/:projectId/measurements", measurementsRouter);
projectsRouter.use("/:projectId/boq", boqRouter);
projectsRouter.use("/:projectId/rates", ratesRouter);
projectsRouter.use("/:projectId/drawings", drawingsRouter);
projectsRouter.use("/:projectId/approvals", approvalsRouter);
projectsRouter.use("/:projectId/reports", reportsRouter);
projectsRouter.use("/:projectId/equipment", equipmentRouter);
projectsRouter.use("/:projectId/materials", materialsRouter);
projectsRouter.use("/:projectId/labour", labourRouter);

projectsRouter.get("/:projectId", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const project = await assertProjectAccess(userId, (req.params as { projectId: string }).projectId);
    res.json({ project });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});
