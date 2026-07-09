import type { RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { signInSchema, signInSetupSchema, orgProfileUpdateSchema } from "../../src/domain/schemas.js";
import { requirePrisma } from "../db.js";
import { setAuthCookies, clearAuthCookies } from "../security/cookies.js";
import { isDevAuthAllowed, sendSafeError } from "../security/httpErrors.js";
import {
  ensureStarterProject,
  loadUserSession,
  serializeSession,
} from "../services/authSession.js";

export const signInHandler: RequestHandler = async (req, res) => {
  if (!isDevAuthAllowed()) {
    return res.status(403).json({ error: "Email sign-in is disabled in production without Supabase JWT" });
  }

  const parsed = signInSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  try {
    const prisma = requirePrisma();
    const { email, name } = parsed.data;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: name ?? email.split("@")[0] },
      });
    } else if (name && name !== user.name) {
      user = await prisma.user.update({ where: { id: user.id }, data: { name } });
    }

    let membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: {
        organization: {
          include: { projects: { orderBy: { updatedAt: "desc" }, take: 1, select: { id: true } } },
        },
      },
    });

    if (!membership) {
      const org = await prisma.organization.create({
        data: {
          name: `${name ?? "My"} Organization`,
          contactEmail: email,
          setupComplete: false,
          members: { create: { userId: user.id, role: "SUPER_ADMIN" } },
        },
        include: {
          projects: { orderBy: { updatedAt: "desc" }, take: 1, select: { id: true } },
        },
      });
      membership = await prisma.organizationMember.findFirst({
        where: { userId: user.id, orgId: org.id },
        include: {
          organization: {
            include: { projects: { orderBy: { updatedAt: "desc" }, take: 1, select: { id: true } } },
          },
        },
      });
    }

    setAuthCookies(res, `dev:${user.id}`);
    const session = serializeSession(user, membership);
    res.json(session);
  } catch (e) {
    console.error(e);
    sendSafeError(res, e, 503, "Sign-in failed. Check DATABASE_URL and run migrations.");
  }
};

/** @deprecated Use POST /api/auth/sign-in */
export const devSessionHandler: RequestHandler = async (req, res, next) => {
  req.body = {
    email: typeof req.body?.email === "string" ? req.body.email : "dev@local.test",
    name: "Local Developer",
  };
  await signInHandler(req, res, next);
};

export const setupHandler: RequestHandler = async (req, res) => {
  try {
    const prisma = requirePrisma();
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const parsed = signInSetupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const data = parsed.data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        jobTitle: data.jobTitle,
        phone: data.phone || null,
      },
    });

    let membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: { include: { projects: { take: 1, select: { id: true } } } } },
    });

    const orgData = {
      name: data.orgName,
      registrationId: data.registrationId || null,
      contactEmail: data.contactEmail,
      phone: data.orgPhone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country,
      currency: data.currency,
      taxRate: new Prisma.Decimal(data.taxRate),
      unitSystem: data.unitSystem,
      precision: data.precision,
      isStandardsDefault: data.isStandardsDefault,
      setupComplete: true,
    };

    if (membership) {
      await prisma.organization.update({
        where: { id: membership.organization.id },
        data: orgData,
      });
      if (membership.role !== data.orgRole) {
        await prisma.organizationMember.update({
          where: { id: membership.id },
          data: { role: data.orgRole },
        });
      }
    } else {
      const org = await prisma.organization.create({
        data: {
          ...orgData,
          members: { create: { userId, role: data.orgRole } },
        },
      });
      membership = {
        id: "",
        userId,
        orgId: org.id,
        role: data.orgRole,
        organization: { ...org, projects: [] },
      } as typeof membership;
    }

    const project = await ensureStarterProject(
      prisma,
      membership!.organization.id,
      userId,
      data.isStandardsDefault,
    );

    const refreshed = await loadUserSession(prisma, userId);
    res.json({ ...refreshed, defaultProjectId: project.id });
  } catch (e) {
    console.error(e);
    sendSafeError(res, e);
  }
};

export const sessionHandler: RequestHandler = async (req, res) => {
  try {
    const prisma = requirePrisma();
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const session = await loadUserSession(prisma, userId);
    if (!session) return res.status(404).json({ error: "User not found" });
    res.json(session);
  } catch (e) {
    console.error(e);
    sendSafeError(res, e);
  }
};

/** @deprecated Use GET /api/auth/session */
export const meHandler: RequestHandler = sessionHandler;

export const logoutHandler: RequestHandler = (_req, res) => {
  clearAuthCookies(res);
  res.status(204).end();
};

export const orgGetHandler: RequestHandler = async (req, res) => {
  try {
    const prisma = requirePrisma();
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
      orderBy: { organization: { updatedAt: "desc" } },
    });
    if (!membership) return res.status(404).json({ error: "No organization" });

    const org = membership.organization;
    res.json({
      organization: {
        id: org.id,
        name: org.name,
        registrationId: org.registrationId,
        contactEmail: org.contactEmail,
        phone: org.phone,
        address: org.address,
        city: org.city,
        state: org.state,
        country: org.country,
        currency: org.currency,
        taxRate: Number(org.taxRate),
        unitSystem: org.unitSystem,
        precision: org.precision,
        isStandardsDefault: org.isStandardsDefault,
        setupComplete: org.setupComplete,
      },
      orgRole: membership.role,
    });
  } catch (e) {
    console.error(e);
    sendSafeError(res, e);
  }
};

export const orgPatchHandler: RequestHandler = async (req, res) => {
  try {
    const prisma = requirePrisma();
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
      orderBy: { organization: { updatedAt: "desc" } },
    });
    if (!membership) return res.status(404).json({ error: "No organization" });

    const parsed = orgProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const data = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (data.orgName !== undefined) updateData.name = data.orgName;
    if (data.registrationId !== undefined) updateData.registrationId = data.registrationId || null;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.orgPhone !== undefined) updateData.phone = data.orgPhone || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.city !== undefined) updateData.city = data.city || null;
    if (data.state !== undefined) updateData.state = data.state || null;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.taxRate !== undefined) updateData.taxRate = new Prisma.Decimal(data.taxRate);
    if (data.unitSystem !== undefined) updateData.unitSystem = data.unitSystem;
    if (data.precision !== undefined) updateData.precision = data.precision;
    if (data.isStandardsDefault !== undefined) updateData.isStandardsDefault = data.isStandardsDefault;

    const updated = await prisma.organization.update({
      where: { id: membership.organization.id },
      data: updateData,
    });

    res.json({
      organization: {
        id: updated.id,
        name: updated.name,
        registrationId: updated.registrationId,
        contactEmail: updated.contactEmail,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        country: updated.country,
        currency: updated.currency,
        taxRate: Number(updated.taxRate),
        unitSystem: updated.unitSystem,
        precision: updated.precision,
        isStandardsDefault: updated.isStandardsDefault,
        setupComplete: updated.setupComplete,
      },
    });
  } catch (e) {
    console.error(e);
    sendSafeError(res, e);
  }
};
