import { describe, it, expect } from "vitest";
import { computeRateBreakdown } from "../src/domain/rateEngine";

describe("computeRateBreakdown", () => {
  it("adds overhead and profit on direct costs", () => {
    const r = computeRateBreakdown({
      materialCost: 100,
      labourCost: 50,
      equipmentCost: 10,
      overheadPct: 10,
      profitPct: 8,
    });
    expect(r.subtotalDirect).toBe(160);
    expect(r.overheadAmount).toBeCloseTo(16, 5);
    expect(r.totalRate).toBeGreaterThan(160);
  });
});
