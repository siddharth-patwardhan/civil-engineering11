import { describe, it, expect } from "vitest";
import { assistantResponseSchema } from "../src/domain/assistantSchema";

describe("assistantResponseSchema", () => {
  it("accepts minimal valid assistant payload", () => {
    const parsed = assistantResponseSchema.safeParse({
      warnings: ["Insufficient information for safe structural recommendation."],
      isClauses: [{ clause: "26.4", "topic": "Cover", standardId: "seed-is456-cover-slab" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid clause shape", () => {
    const parsed = assistantResponseSchema.safeParse({
      isClauses: [{ clause: 123 }],
    });
    expect(parsed.success).toBe(false);
  });
});
