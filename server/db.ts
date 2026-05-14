import { PrismaClient } from "@prisma/client";

export const prisma: PrismaClient | null = process.env.DATABASE_URL
  ? new PrismaClient({ log: ["error", "warn"] })
  : null;

export function requirePrisma(): PrismaClient {
  if (!prisma) {
    throw new Error("DATABASE_URL is not configured");
  }
  return prisma;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && prisma);
}
