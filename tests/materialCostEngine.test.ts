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

  it("parses official Maharashtra PWD State Schedule of Rates (SSR 2022-23/2025 PDF) format", () => {
    const mahaPdfText = `
      State Schedule of Rates for the year 2022-23 as approved by Public Works Department Maharashtra
      Item No Section Code Description Unit Rate (In Rs.) GST (In Rs.)
      26 Road Survey and DPR 1.26 Survey of C.D. works including L-section and trial pits One Number 16334 12135
      103 Road Sub grade 2.29b Supplying soft murum at the road site, including conveying and stacking complete One Cubic Metre 432 53
      113 Road Sub Base 3.01 MORTH 401 Construction of granular sub-base with close graded Material One Cubic Metre 2039 36
      127 Road Sub Base 3.14 Brooming the W.B.M. surface by wire Brushes for receiving bituminous treatment One Square Metre 18 18
      156 Road Surfacing 3.44 MORTH 505 DENSE BITUMINOUS MACADAM using crushed aggregates One Cubic Metre 9664 85
      167 Road Surfacing 4.12 MORTH 510 Open Graded Premix Surfacing OGC 20 mm thickness One Square Metre 193 5
    `;

    const parsed = parseMaterialTextOrPdf(mahaPdfText);
    expect(parsed.length).toBe(6);
    expect(parsed[0].code).toBe("MH-PWD-26");
    expect(parsed[0].baseRate).toBe(16334);
    expect(parsed[0].unit).toBe("nos");
    expect(parsed[0].category).toBe("Survey & Consultancy");

    expect(parsed[1].code).toBe("MH-PWD-103");
    expect(parsed[1].baseRate).toBe(432);
    expect(parsed[1].unit).toBe("m³");
    expect(parsed[1].category).toBe("Earthwork & Subgrade");

    expect(parsed[2].code).toBe("MH-PWD-113");
    expect(parsed[2].baseRate).toBe(2039);
    expect(parsed[2].unit).toBe("m³");

    expect(parsed[4].code).toBe("MH-PWD-156");
    expect(parsed[4].baseRate).toBe(9664);
    expect(parsed[4].unit).toBe("m³");
    expect(parsed[4].category).toBe("Road Surfacing & Asphalt");

    expect(parsed[5].code).toBe("MH-PWD-167");
    expect(parsed[5].baseRate).toBe(193);
    expect(parsed[5].unit).toBe("m²");
  });

  it("filters out noisy UI metadata text like temp, MonthlyINR, dates, and active status", () => {
    const noisyText = `
      temp
      TEMP
      5 components
      MonthlyINR
      30
      Jul 01, 2026
      Active
      [MH-PWD-MAT-01] Ordinary Portland Cement (OPC 53 Grade) | Unit: bag (50kg) | Base Rate: Rs.380 | Nashik: Rs.390 | Ref: Maharashtra PWD SSR
    `;

    const parsed = parseMaterialTextOrPdf(noisyText);
    expect(parsed.length).toBe(1);
    expect(parsed[0].code).toBe("MH-PWD-MAT-01");
    expect(parsed[0].name).toBe("Ordinary Portland Cement (OPC 53 Grade)");
    expect(parsed[0].unit).toBe("bag");
    expect(parsed[0].baseRate).toBe(380);
  });

  it("includes valid government DSR material bundle items", () => {
    expect(GOVERNMENT_DSR_MATERIAL_BUNDLE.length).toBeGreaterThan(10);
    const opc = GOVERNMENT_DSR_MATERIAL_BUNDLE.find((m) => m.code === "CPWD-DSR-3.1");
    expect(opc).toBeDefined();
    expect(opc?.unit).toBe("bag");
    expect(opc?.baseRate).toBe(380);
  });
});
