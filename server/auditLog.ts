import type { Prisma } from "@prisma/client";
import { requirePrisma } from "./db.js";

export async function writeAudit(
  actorId: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  payload?: Prisma.InputJsonValue,
) {
  try {
    const prisma = requirePrisma();
    await prisma.auditEvent.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        payload: payload ?? undefined,
      },
    });
  } catch (e) {
    console.warn("[audit] skipped:", e);
  }
}
