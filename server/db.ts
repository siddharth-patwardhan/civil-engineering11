import { PrismaClient } from "@prisma/client";
import { memoryDb } from "./dbMemory.js";

// Return memoryDb as client so all routes work seamlessly out of the box
export const prisma: any = memoryDb;

export function requirePrisma(): PrismaClient {
  return prisma as unknown as PrismaClient;
}

export function isDbConfigured(): boolean {
  return true;
}
