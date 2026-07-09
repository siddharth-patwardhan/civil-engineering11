import type { Request, Response } from "express";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { assistantResponseSchema } from "../../src/domain/assistantSchema.js";
import { prisma } from "../db.js";
import { STRUCTURAL_ASSISTANT_SYSTEM } from "../prompts/assistantStructPrompt.js";
import { sendSafeError } from "../security/httpErrors.js";

const assistantInputSchema = z.object({
  description: z.string().min(1).max(4000),
});

const PROMPT_SUFFIX = `Respond STRICTLY in the following JSON format:
{
  "projectInterpretation": {
    "identifiedStructure": "string",
    "spanType": "string",
    "estimatedUsage": "string",
    "structuralRisk": "string (Low/Medium/High/Critical)"
  },
  "recommendations": {
    "concreteGrade": "string",
    "reinforcementGrade": "string",
    "slabThickness": "string",
    "beamRecommendation": "string",
    "nominalCover": "string",
    "durabilityRecommendation": "string",
    "exposureConditionGuidance": "string",
    "disclaimer": "Recommendations are advisory in nature and must be verified by a licensed structural engineer before execution."
  },
  "warnings": ["warning 1", "warning 2"],
  "isClauses": [
    {"clause": "8.2", "topic": "Minimum Grade of Concrete"}
  ],
  "estimationImpact": {
    "recommendedMaterials": {
      "concrete": "string",
      "steel": "string"
    },
    "estimatedElements": ["string"]
  }
}
Do NOT include markdown. Return raw JSON.`;

export async function analyzeStructureHandler(req: Request, res: Response) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Assistant is not configured" });
    }

    const parsedInput = assistantInputSchema.safeParse(req.body);
    if (!parsedInput.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `${STRUCTURAL_ASSISTANT_SYSTEM}

Input Data:
${JSON.stringify({ description: parsedInput.data.description }, null, 2)}

${PROMPT_SUFFIX}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let raw: unknown;
    try {
      raw = JSON.parse(response.text || "{}");
    } catch {
      return res.status(502).json({ error: "Model returned non-JSON" });
    }

    const parsed = assistantResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(502).json({ error: "Model JSON failed schema validation" });
    }

    let data = parsed.data;
    if (data.isClauses?.length && prisma) {
      const standards = await prisma.isStandard.findMany({
        where: { code: "IS456" },
      });
      data = {
        ...data,
        isClauses: data.isClauses.map((c) => {
          const match = standards.find(
            (s) => s.section === c.clause || c.topic.includes(s.section),
          );
          return { ...c, standardId: match?.id };
        }),
      };
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    sendSafeError(res, err, 500, "Assistant request failed");
  }
}
