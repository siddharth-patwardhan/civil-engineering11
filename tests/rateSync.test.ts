import { describe, it, expect } from "vitest";
import { boqLineAfterRateUpdate } from "../src/domain/rateSync";

describe("boqLineAfterRateUpdate", () => {
  it("recomputes amount from quantity and new rate", () => {
    const result = boqLineAfterRateUpdate({ quantity: 100, rate: 15 }, 250);
    expect(result.rate).toBe(250);
    expect(result.amount).toBe(25000);
  });

  it("handles zero quantity", () => {
    const result = boqLineAfterRateUpdate({ quantity: 0, rate: 100 }, 200);
    expect(result.amount).toBe(0);
  });
});
