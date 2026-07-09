import type { RequestHandler } from "express";
import { z } from "zod";

const uuidSchema = z.string().uuid();

/** Validates common UUID route params to block injection / enumeration probes. */
export const validateProjectId: RequestHandler = (req, res, next) => {
  const projectId = (req.params as { projectId?: string }).projectId;
  if (projectId && !uuidSchema.safeParse(projectId).success) {
    return res.status(400).json({ error: "Invalid project id" });
  }
  next();
};
