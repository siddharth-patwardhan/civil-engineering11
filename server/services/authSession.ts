import type { OrgRole } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

export interface SessionPayload {
  user: {
    id: string;
    email: string;
    name: string | null;
    jobTitle: string | null;
    phone: string | null;
  };
  organization: {
    id: string;
    name: string;
    registrationId: string | null;
    contactEmail: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string;
    currency: string;
    taxRate: number;
    unitSystem: string;
    precision: number;
    isStandardsDefault: string | null;
    setupComplete: boolean;
  } | null;
  orgRole: OrgRole | null;
  needsSetup: boolean;
  defaultProjectId: string | null;
}

export function serializeSession(
  user: {
    id: string;
    email: string;
    name: string | null;
    jobTitle: string | null;
    phone: string | null;
  },
  membership: {
    role: OrgRole;
    organization: {
      id: string;
      name: string;
      registrationId: string | null;
      contactEmail: string | null;
      phone: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      country: string;
      currency: string;
      taxRate: Prisma.Decimal;
      unitSystem: string;
      precision: number;
      isStandardsDefault: string | null;
      setupComplete: boolean;
      projects: { id: string }[];
    };
  } | null,
): SessionPayload {
  const org = membership?.organization ?? null;
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      jobTitle: user.jobTitle,
      phone: user.phone,
    },
    organization: org
      ? {
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
        }
      : null,
    orgRole: membership?.role ?? null,
    needsSetup: !org?.setupComplete,
    defaultProjectId: org?.projects[0]?.id ?? null,
  };
}

export async function loadUserSession(prisma: PrismaClient, userId: string): Promise<SessionPayload | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: {
      organization: {
        include: {
          projects: { orderBy: { updatedAt: "desc" }, take: 1, select: { id: true } },
        },
      },
    },
    orderBy: { organization: { updatedAt: "desc" } },
  });

  return serializeSession(user, membership);
}

export async function ensureStarterProject(
  prisma: PrismaClient,
  orgId: string,
  userId: string,
  isStandardsDefault: string | null,
) {
  let project = await prisma.project.findFirst({ where: { orgId } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        orgId,
        name: "Starter Project",
        clientName: "Internal",
        location: "TBD",
        isStandardsVersion: isStandardsDefault ?? "IS 456:2000",
      },
    });
    await prisma.projectMember.create({
      data: { projectId: project.id, userId, role: "OWNER" },
    });
  }
  return project;
}
