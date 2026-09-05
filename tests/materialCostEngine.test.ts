import { describe, expect, it } from "vitest";
import {
  calculateRelativeMaterialCost,
  parseMaterialTextOrPdf,
  GOVERNMENT_DSR_MATERIAL_BUNDLE,
} from "../src/domain/materialCostEngine";

describe("materialCostEngine", () => {
  it("calculates relative cost variance between base DSR rate and current market rate", () => {
    const res = calculateRelativeMaterialCost({
      baseRate: 380,
      currentRate: 420,
      quantity: 100,
      multiplier: 1.05, // +5% location factor
    });

    expect(res.baseRate).toBe(380);
    expect(res.adjustedBaseRate).toBe(399); // 380 * 1.05
    expect(res.currentRate).toBe(420);
    expect(res.effectiveRate).toBe(441); // 420 * 1.05
    expect(res.diffAmount).toBe(42); // 441 - 399
    expect(res.diffPercent).toBe(10.53); // 42 / 399 * 100
    expect(res.status).toBe("increased");
    expect(res.totalVariance).toBe(4200); // 42 * 100
  });

  it("handles decreased rates", () => {
    const res = calculateRelativeMaterialCost({
      baseRate: 1800,
      currentRate: 1650,
      quantity: 10,
    });

    expect(res.status).toBe("decreased");
    expect(res.diffAmount).toBe(-150);
    expect(res.totalVariance).toBe(-1500);
  });

  it("parses material items from text/pdf lines", () => {
    const samplePdfText = `
      CPWD DSR Schedule 2023
      CPWD-3.1 OPC 53 Grade Cement bag Rs. 380 IS 269:2015
      CPWD-5.22 TMT Steel Fe-500D bars kg 68.50 IS 1786:2008
      CPWD-3.8 River Sand Zone II m³ 1650.00
    `;

    const parsed = parseMaterialTextOrPdf(samplePdfText);
    expect(parsed.length).toBe(3);
    expect(parsed[0].code).toBe("CPWD-3.1");
    expect(parsed[0].baseRate).toBe(380);
    expect(parsed[0].category).toBe("Concrete & Masonry");
    expect(parsed[1].code).toBe("CPWD-5.22");
    expect(parsed[1].baseRate).toBe(68.5);
    expect(parsed[1].category).toBe("Metals & Steel");
  });

  it("includes valid government DSR material bundle items", () => {
    expect(GOVERNMENT_DSR_MATERIAL_BUNDLE.length).toBeGreaterThan(10);
    const opc = GOVERNMENT_DSR_MATERIAL_BUNDLE.find((m) => m.code === "CPWD-DSR-3.1");
    expect(opc).toBeDefined();
    expect(opc?.unit).toBe("bag");
    expect(opc?.baseRate).toBe(380);
  });
});
