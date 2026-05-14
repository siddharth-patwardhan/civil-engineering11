import type { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { assistantResponseSchema } from "../../src/domain/assistantSchema.js";
import { prisma } from "../db.js";
import { STRUCTURAL_ASSISTANT_SYSTEM } from "../prompts/assistantStructPrompt.js";

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
      return res.status(500).json({ error: "GEMINI_API_KEY is not defined" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `${STRUCTURAL_ASSISTANT_SYSTEM}

Input Data:
${JSON.stringify(req.body, null, 2)}

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
      return res.status(502).json({
        error: "Model JSON failed schema validation",
        details: parsed.error.flatten(),
        raw,
      });
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
    res.status(500).json({ error: String(err) });
  }
}

export function registerAssistantRoute(app: Express) {
  app.post("/api/analyze-structure", analyzeStructureHandler);
}
