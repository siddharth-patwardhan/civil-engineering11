import { z } from "zod";

/** Validates Gemini JSON; used server-side and in contract tests. */
export const assistantResponseSchema = z.object({
  projectInterpretation: z
    .object({
      identifiedStructure: z.string(),
      spanType: z.string(),
      estimatedUsage: z.string(),
      structuralRisk: z.string(),
    })
    .optional(),
  recommendations: z
    .object({
      concreteGrade: z.string(),
      reinforcementGrade: z.string(),
      slabThickness: z.string(),
      beamRecommendation: z.string(),
      nominalCover: z.string(),
      durabilityRecommendation: z.string(),
      exposureConditionGuidance: z.string(),
      disclaimer: z.string(),
    })
    .optional(),
  warnings: z.array(z.string()).optional(),
  isClauses: z
    .array(
      z.object({
        clause: z.string(),
        topic: z.string(),
        standardId: z.string().optional(),
      }),
    )
    .optional(),
  estimationImpact: z
    .object({
      recommendedMaterials: z.object({
        concrete: z.string(),
        steel: z.string(),
      }),
      estimatedElements: z.array(z.string()),
    })
    .optional(),
});

export type AssistantResponse = z.infer<typeof assistantResponseSchema>;
