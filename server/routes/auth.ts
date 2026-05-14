import type { RequestHandler } from "express";
import { requirePrisma } from "../db.js";

export const devSessionHandler: RequestHandler = async (req, res) => {
  try {
    const prisma = requirePrisma();
    const email =
      typeof req.body?.email === "string" && req.body.email.includes("@")
        ? req.body.email
        : "dev@local.test";

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: "Local Developer" },
      });
    }

    let org = await prisma.organization.findFirst({
      where: { members: { some: { userId: user.id } } },
    });
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "Demo Organization",
          members: {
            create: { userId: user.id, role: "SUPER_ADMIN" },
          },
        },
      });
    }

    let project = await prisma.project.findFirst({
      where: { orgId: org.id },
    });
    if (!project) {
      project = await prisma.project.create({
        data: {
          orgId: org.id,
          name: "Demo Civil Project",
          clientName: "Demo Client",
          location: "Sector 7",
          isStandardsVersion: "IS 456:2000",
        },
      });
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: "OWNER",
        },
      });
    }

    res.json({
      token: `dev:${user.id}`,
      user: { id: user.id, email: user.email, name: user.name },
      defaultProjectId: project.id,
    });
  } catch (e) {
    console.error(e);
    res.status(503).json({
      error: "Database unavailable. Set DATABASE_URL and run prisma migrate + seed.",
    });
  }
};

export const meHandler: RequestHandler = async (req, res) => {
  try {
    const prisma = requirePrisma();
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: String(e) });
  }
};
