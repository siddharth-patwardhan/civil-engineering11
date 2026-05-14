import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { Router } from "express";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

const uploadDir = path.join(process.cwd(), "uploads", "drawings");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

export const drawingsRouter = Router({ mergeParams: true });

drawingsRouter.get("/", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const list = await prisma.drawing.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ drawings: list });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: String(e) });
  }
});

/** Async job stub: mark PROCESSING then COMPLETE on next tick */
drawingsRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId } = req.params as { projectId: string };
    await assertProjectAccess(userId, projectId);
    if (!req.file) {
      return res.status(400).json({ error: "Missing file field (multipart name: file)" });
    }
    const prisma = requirePrisma();
    const drawing = await prisma.drawing.create({
      data: {
        projectId,
        fileName: req.file.originalname,
        storagePath: req.file.filename,
        jobStatus: "PROCESSING",
      },
    });
    await writeAudit(userId, "drawing.upload", "Drawing", drawing.id, {
      fileName: drawing.fileName,
    });
    setImmediate(() => {
      void (async () => {
        try {
          const p = requirePrisma();
          await p.drawing.update({
            where: { id: drawing.id },
            data: { jobStatus: "COMPLETE", meta: { note: "Stub processing complete" } },
          });
        } catch (err) {
          console.error(err);
        }
      })();
    });
    res.status(201).json({ drawing });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: String(e) });
  }
});
