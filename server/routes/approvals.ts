import { randomUUID } from "node:crypto";
import { safeErrorMessage } from "../security/httpErrors.js";
import { Router } from "express";
import { approvalTransitionSchema } from "../../src/domain/schemas.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const approvalsRouter = Router({ mergeParams: true });

approvalsRouter.get("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const rows = await prisma.approval.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ approvals: rows });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

approvalsRouter.patch("/:entityType/:entityId", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, entityType, entityId } = req.params as {
      projectId: string;
      entityType: string;
      entityId: string;
    };
    await assertProjectAccess(userId, projectId);
    const parsed = approvalTransitionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const prisma = requirePrisma();
    const existing = await prisma.approval.findFirst({
      where: { projectId, entityType, entityId },
    });
    const approval = existing
      ? await prisma.approval.update({
          where: { id: existing.id },
          data: {
            state: parsed.data.state,
            note: parsed.data.note,
          },
        })
      : await prisma.approval.create({
          data: {
            id: randomUUID(),
            projectId,
            entityType,
            entityId,
            state: parsed.data.state,
            note: parsed.data.note,
          },
        });
    await writeAudit(userId, "approval.transition", "Approval", approval.id, {
      state: parsed.data.state,
    });
    res.json({ approval });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});
