import { Router } from "express";
import { requirePrisma } from "../db.js";
import { assertProjectAccess } from "../services/projectAccess.js";

export const reportsRouter = Router({ mergeParams: true });

reportsRouter.get("/boq/:versionId/pdf", async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { projectId, versionId } = req.params as { projectId: string; versionId: string };
    await assertProjectAccess(userId, projectId);
    const prisma = requirePrisma();
    const version = await prisma.boqVersion.findFirst({
      where: { id: versionId, projectId },
      include: { lines: true },
    });
    if (!version) return res.status(404).json({ error: "BOQ version not found" });
    const rows = version.lines
      .map(
        (l) =>
          `<tr><td>${l.itemNo}</td><td>${escapeHtml(l.description)}</td><td>${l.unit}</td><td>${l.quantity}</td><td>${l.rate}</td><td>${l.amount}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>BOQ v${version.version}</title></head><body><h1>BOQ export (stub)</h1><p>Project ${escapeHtml(projectId)} — Version ${version.version}</p><table border="1" cellpadding="6"><thead><tr><th>Item</th><th>Description</th><th>Unit</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><p>Replace with Puppeteer/Playwright PDF pipeline in production.</p></body></html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="boq-v${version.version}.html"`);
    res.send(html);
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 503;
    res.status(status).json({ error: String(e) });
  }
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
