import { Prisma } from "@prisma/client";
import { safeErrorMessage } from "../security/httpErrors.js";
import { createHash } from "node:crypto";
import { Router } from "express";
import { generateBoqFromMeasurements } from "../../src/domain/boqGenerator.js";
import { measureRowInputSchema, coerceMeasurementUnit, boqLinesSyncBodySchema } from "../../src/domain/schemas.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const boqRouter = Router({ mergeParams: true });

boqRouter.get("/versions", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const versions = await prisma.boqVersion.findMany({
      where: { projectId },
      orderBy: { version: "desc" },
      include: { lines: true },
    });
    res.json({
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        label: v.label,
        snapshotHash: v.snapshotHash,
        createdAt: v.createdAt,
        lines: v.lines.map((l) => ({
          id: l.id,
          itemNo: l.itemNo,
          description: l.description,
          unit: l.unit,
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          amount: Number(l.amount),
        })),
      })),
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

boqRouter.post("/versions", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();

    const fromVersion = req.body?.fromVersion as number | undefined;
    let linesPayload = generateBoqFromMeasurements([]);

    if (typeof fromVersion === "number") {
      const prev = await prisma.boqVersion.findFirst({
        where: { projectId, version: fromVersion },
        include: { lines: true },
      });
      if (!prev) {
        return res.status(404).json({ error: "Version not found" });
      }
      linesPayload = prev.lines.map((l) => ({
        itemNo: l.itemNo,
        description: l.description,
        unit: l.unit,
        quantity: Number(l.quantity),
        rate: Number(l.rate),
        amount: Number(l.amount),
      }));
    } else {
      const meas = await prisma.measurementLine.findMany({
        where: { projectId },
        orderBy: { rowIndex: "asc" },
      });
      const rows = meas.map((m) =>
        measureRowInputSchema.parse({
          id: m.id,
          desc: m.desc,
          no: m.no ?? "",
          l: m.l ?? "",
          w: m.w ?? "",
          h: m.h ?? "",
          unit: coerceMeasurementUnit(m.unit),
          templateKey: m.templateKey,
          formulaJson: m.formulaJson,
          deductionsJson: m.deductionsJson,
        }),
      );
      linesPayload = generateBoqFromMeasurements(rows);
    }

    const last = await prisma.boqVersion.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
    });
    const nextVersion = (last?.version ?? 0) + 1;
    const snapshotHash = createHash("sha256")
      .update(JSON.stringify(linesPayload))
      .digest("hex");

    const version = await prisma.boqVersion.create({
      data: {
        projectId,
        version: nextVersion,
        label: req.body?.label ?? `v${nextVersion}`,
        snapshotHash,
        createdById: userId,
        lines: {
          create: linesPayload.map((l) => ({
            itemNo: l.itemNo,
            description: l.description,
            unit: l.unit,
            quantity: l.quantity,
            rate: l.rate,
            amount: l.amount,
          })),
        },
      },
      include: { lines: true },
    });

    await writeAudit(userId, "boq.version.create", "BoqVersion", version.id, {
      version: nextVersion,
      snapshotHash,
    });
    res.status(201).json({ version });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

boqRouter.put("/versions/:versionId/lines", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, versionId } = req.params as { projectId: string; versionId: string };
    await assertProjectAccess(userId, projectId);
    const parsed = boqLinesSyncBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const prisma = requirePrisma();
    const version = await prisma.boqVersion.findFirst({
      where: { id: versionId, projectId },
      include: { lines: true },
    });
    if (!version) return res.status(404).json({ error: "BOQ version not found" });

    const existingById = new Map(version.lines.map((l) => [l.id, l]));
    const keptIds = new Set<string>();

    await prisma.$transaction(async (tx) => {
      for (const line of parsed.data.lines) {
        const data = {
          itemNo: line.itemNo,
          description: line.description,
          unit: line.unit,
          quantity: new Prisma.Decimal(line.quantity),
          rate: new Prisma.Decimal(line.rate),
          amount: new Prisma.Decimal(line.amount),
        };
        if (line.id && existingById.has(line.id)) {
          await tx.boqLine.update({ where: { id: line.id }, data });
          keptIds.add(line.id);
        } else {
          const created = await tx.boqLine.create({
            data: { boqVersionId: versionId, ...data },
          });
          keptIds.add(created.id);
        }
      }
      const toDelete = version.lines.filter((l) => !keptIds.has(l.id)).map((l) => l.id);
      if (toDelete.length > 0) {
        await tx.boqLine.deleteMany({ where: { id: { in: toDelete } } });
      }
      const snapshotHash = createHash("sha256")
        .update(JSON.stringify(parsed.data.lines))
        .digest("hex");
      await tx.boqVersion.update({
        where: { id: versionId },
        data: { snapshotHash },
      });
    });

    const updated = await prisma.boqVersion.findFirst({
      where: { id: versionId },
      include: { lines: true },
    });
    await writeAudit(userId, "boq.lines.sync", "BoqVersion", versionId, {
      lineCount: parsed.data.lines.length,
    });
    res.json({
      version: {
        id: String(updated!.id),
        version: Number(updated!.version),
        label: updated!.label ? String(updated!.label) : null,
        lines: (updated!.lines as any[]).map((l: any) => ({
          id: String(l.id),
          itemNo: String(l.itemNo),
          description: String(l.description),
          unit: String(l.unit),
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          amount: Number(l.amount),
        })),
      },
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});

boqRouter.get("/versions/:a/diff/:b", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, a, b } = req.params as { projectId: string; a: string; b: string };
    await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const [va, vb] = await Promise.all([
      prisma.boqVersion.findFirst({
        where: { projectId, id: a },
        include: { lines: true },
      }),
      prisma.boqVersion.findFirst({
        where: { projectId, id: b },
        include: { lines: true },
      }),
    ]);
    if (!va || !vb) return res.status(404).json({ error: "Version not found" });
    const diff = {
      added: [] as string[],
      removed: [] as string[],
      changed: [] as { itemNo: string; field: string; from: string; to: string }[],
    };
    const mapA = new Map((va.lines as any[]).map((l: any) => [String(l.itemNo), l]));
    const mapB = new Map((vb.lines as any[]).map((l: any) => [String(l.itemNo), l]));
    for (const [no, lb] of mapB.entries()) {
      const itemNo = String(no);
      const la = mapA.get(itemNo);
      if (!la) diff.added.push(itemNo);
      else {
        for (const f of ["quantity", "rate", "amount", "description"] as const) {
          const av = String((la as Record<string, unknown>)[f] ?? "");
          const bv = String((lb as Record<string, unknown>)[f] ?? "");
          if (av !== bv) {
            diff.changed.push({ itemNo, field: f, from: av, to: bv });
          }
        }
      }
    }
    for (const no of mapA.keys()) {
      const itemNo = String(no);
      if (!mapB.has(itemNo)) diff.removed.push(itemNo);
    }
    res.json({ diff });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: safeErrorMessage(e) });
  }
});
