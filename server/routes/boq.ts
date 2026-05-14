import { createHash } from "node:crypto";
import { Router } from "express";
import { generateBoqFromMeasurements } from "../../src/domain/boqGenerator.js";
import { measureRowInputSchema } from "../../src/domain/schemas.js";
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
    res.status(status).json({ error: String(e) });
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
          unit: m.unit as "m³" | "m²" | "m" | "nos",
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
    res.status(status).json({ error: String(e) });
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
    const mapA = new Map(va.lines.map((l) => [l.itemNo, l]));
    const mapB = new Map(vb.lines.map((l) => [l.itemNo, l]));
    for (const [no, lb] of mapB) {
      const la = mapA.get(no);
      if (!la) diff.added.push(no);
      else {
        for (const f of ["quantity", "rate", "amount", "description"] as const) {
          const av = String(la[f]);
          const bv = String(lb[f]);
          if (av !== bv) {
            diff.changed.push({ itemNo: no, field: f, from: av, to: bv });
          }
        }
      }
    }
    for (const no of mapA.keys()) {
      if (!mapB.has(no)) diff.removed.push(no);
    }
    res.json({ diff });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: String(e) });
  }
});
