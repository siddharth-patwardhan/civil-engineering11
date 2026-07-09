import type { Prisma } from "@prisma/client";
import { safeErrorMessage } from "../security/httpErrors.js";
import { Router } from "express";
import { defaultOpForUnit, resolveQuantityStrict } from "../../src/domain/formula.js";
import { measurementSyncBodySchema } from "../../src/domain/schemas.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const measurementsRouter = Router({ mergeParams: true });

measurementsRouter.get("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const rows = await prisma.measurementLine.findMany({
      where: { projectId },
      orderBy: { rowIndex: "asc" },
    });
    res.json({
      lines: rows.map((r) => ({
        id: r.id,
        desc: r.desc,
        no: r.no ?? "",
        l: r.l ?? "",
        w: r.w ?? "",
        h: r.h ?? "",
        unit: r.unit,
        templateKey: r.templateKey,
        formulaJson: r.formulaJson,
        deductionsJson: r.deductionsJson,
        quantityResolved: r.quantityResolved?.toString() ?? null,
        derivationTrace: r.derivationTrace,
      })),
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

measurementsRouter.put("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    await assertProjectAccess(userId, projectId);
    const parsed = measurementSyncBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const prisma = requirePrisma();
    const { lines } = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.measurementLine.deleteMany({ where: { projectId } });
      let idx = 0;
      for (const row of lines) {
        const op = defaultOpForUnit(row.unit);
        const q = resolveQuantityStrict(row, op);
        let qty = q.ok ? q.quantity : null;
        if (qty != null && row.deductionsJson && typeof row.deductionsJson === "object") {
          const ded = (row.deductionsJson as { deduction?: number }).deduction;
          if (typeof ded === "number" && ded > 0) qty = Math.max(0, qty - ded);
        }
        await tx.measurementLine.create({
          data: {
            projectId,
            rowIndex: idx++,
            desc: row.desc,
            no: row.no ?? null,
            l: row.l ?? null,
            w: row.w ?? null,
            h: row.h ?? null,
            unit: row.unit,
            templateKey: row.templateKey ?? null,
            formulaJson: (row.formulaJson ?? undefined) as Prisma.InputJsonValue | undefined,
            deductionsJson: (row.deductionsJson ?? undefined) as Prisma.InputJsonValue | undefined,
            quantityResolved: qty,
            derivationTrace: (!q.ok
              ? { error: (q as { ok: false; error: string }).error }
              : (JSON.parse(JSON.stringify(q.trace)) as Prisma.InputJsonValue)) as Prisma.InputJsonValue,
          },
        });
      }
    });

    await writeAudit(userId, "measurement.sync", "Project", projectId, {
      lineCount: lines.length,
    });
    res.json({ ok: true, count: lines.length });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});
