import { describe, it, expect } from "vitest";
import type { MeasurementUnit } from "../src/domain/schemas";
import { totalsByUnit } from "../src/domain/measurementTotals";
import { resolveQuantityStrict, defaultOpForUnit } from "../src/domain/formula";

describe("totalsByUnit", () => {
  it("does not mix different units into one total", () => {
    const rows: Array<{
      unit: MeasurementUnit;
      no: string;
      l: string;
      w: string;
      h: string;
    }> = [
      { unit: "m³", no: "1", l: "2", w: "3", h: "4" },
      { unit: "m²", no: "1", l: "5", w: "6", h: "" },
    ];
    const sub = totalsByUnit(rows, (r) =>
      resolveQuantityStrict(r, defaultOpForUnit(r.unit)),
    );
    const m3 = sub.find((s) => s.unit === "m³");
    const m2 = sub.find((s) => s.unit === "m²");
    expect(m3?.total).toBe(24);
    expect(m2?.total).toBe(30);
  });
});
