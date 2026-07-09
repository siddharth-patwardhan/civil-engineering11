import { Router } from "express";
import { generateBoqPdfFromVersion } from "../services/pdfGenerator.js";
import { requirePrisma } from "../db.js";
import { writeAudit } from "../auditLog.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const reportsRouter = Router({ mergeParams: true });

reportsRouter.get("/boq/:versionId/pdf", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, versionId } = req.params as { projectId: string; versionId: string };
    await assertProjectAccess(userId, projectId);

    const { pdf, contentType, filename } = await generateBoqPdfFromVersion(versionId);

    await writeAudit(userId, "report.boq.pdf", "BoqVersion", versionId, {
      filename,
      size: pdf.length,
    });

    res.setHeader("Content-Type", contentType);
    const safeName = filename.replace(/[^\w.\-]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    res.send(pdf);
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: status < 500 ? (e as Error).message : "Failed to generate report" });
  }
});
