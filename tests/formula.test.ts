import { describe, it, expect } from "vitest";
import { resolveQuantityStrict } from "../src/domain/formula";

describe("resolveQuantityStrict", () => {
  it("rejects volume when L/W/H incomplete", () => {
    const r = resolveQuantityStrict(
      { no: "2", l: "1", w: "", h: "1", unit: "m³" },
      "volume",
    );
    expect(r.ok).toBe(false);
  });

  it("computes volume when N and L/W/H provided", () => {
    const r = resolveQuantityStrict(
      { no: "2", l: "2", w: "3", h: "4", unit: "m³" },
      "volume",
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.quantity).toBe(2 * 2 * 3 * 4);
  });

  it("computes running metre as N*L", () => {
    const r = resolveQuantityStrict(
      { no: "12", l: "4.5", w: "", h: "", unit: "rm" },
      "linear",
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.quantity).toBe(54);
  });

  it("computes steel weight D^2/162 * L", () => {
    const r = resolveQuantityStrict(
      { no: "16", l: "12", w: "", h: "", unit: "nos" },
      "steel_weight",
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.quantity).toBeCloseTo((256 / 162) * 12, 5);
  });
});
