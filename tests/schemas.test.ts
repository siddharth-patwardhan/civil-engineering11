import { describe, it, expect } from "vitest";
import {
  rateAnalysisInputSchema,
  boqApplyRateSchema,
  materialInputSchema,
  labourInputSchema,
  boqLinesSyncBodySchema,
} from "../src/domain/schemas";

describe("extended schemas", () => {
  it("accepts rate analysis with boqLineId", () => {
    const r = rateAnalysisInputSchema.safeParse({
      name: "Concrete",
      materialCost: 100,
      labourCost: 80,
      equipmentCost: 15,
      boqLineId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(r.success).toBe(true);
  });

  it("validates boq apply rate body", () => {
    const r = boqApplyRateSchema.safeParse({
      boqLineId: "550e8400-e29b-41d4-a716-446655440000",
      rateBookItemId: "660e8400-e29b-41d4-a716-446655440001",
    });
    expect(r.success).toBe(true);
  });

  it("validates material input", () => {
    const r = materialInputSchema.safeParse({
      code: "CEM",
      name: "Cement",
      category: "cement",
      unit: "bag",
      rate: 420,
    });
    expect(r.success).toBe(true);
  });

  it("validates labour input", () => {
    const r = labourInputSchema.safeParse({
      name: "Mason",
      dailyRate: 900,
      unit: "day",
      skillLevel: "skilled",
    });
    expect(r.success).toBe(true);
  });

  it("requires at least one BOQ line on sync", () => {
    const r = boqLinesSyncBodySchema.safeParse({ lines: [] });
    expect(r.success).toBe(false);
  });
});
