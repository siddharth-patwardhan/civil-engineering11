import { requirePrisma } from "../db.js";

export async function assertProjectAccess(userId: string, projectId: string) {
  const prisma = requirePrisma();
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { members: { some: { userId } } },
        { organization: { members: { some: { userId } } } },
      ],
    },
  });
  if (!project) {
    const err = new Error("FORBIDDEN");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
  return project;
}
