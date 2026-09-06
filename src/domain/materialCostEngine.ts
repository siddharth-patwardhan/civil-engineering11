export interface MaterialCostInput {
  baseRate: number;
  currentRate: number;
  quantity?: number;
  multiplier?: number; // e.g. 1.05 for +5% location index
}

export interface MaterialCostComparison {
  baseRate: number;
  adjustedBaseRate: number;
  currentRate: number;
  effectiveRate: number;
  diffAmount: number;
  diffPercent: number;
  totalCostAtBase: number;
  totalCostAtCurrent: number;
  totalVariance: number;
  status: "increased" | "decreased" | "unchanged";
}

/**
 * Compare base government/DSR rate against current market rate and compute relative cost variance.
 */
export function calculateRelativeMaterialCost(input: MaterialCostInput): MaterialCostComparison {
  const mult = input.multiplier ?? 1.0;
  const baseRate = Math.max(0, input.baseRate);
  const adjustedBaseRate = baseRate * mult;
  const currentRate = Math.max(0, input.currentRate);
  const effectiveRate = currentRate * mult;
  
  const diffAmount = effectiveRate - adjustedBaseRate;
  const diffPercent = adjustedBaseRate > 0 ? (diffAmount / adjustedBaseRate) * 100 : 0;
  
  const qty = Math.max(0, input.quantity ?? 1);
  const totalCostAtBase = adjustedBaseRate * qty;
  const totalCostAtCurrent = effectiveRate * qty;
  const totalVariance = totalCostAtCurrent - totalCostAtBase;

  let status: "increased" | "decreased" | "unchanged" = "unchanged";
  if (diffAmount > 0.001) status = "increased";
  else if (diffAmount < -0.001) status = "decreased";

  return {
    baseRate,
    adjustedBaseRate: Number(adjustedBaseRate.toFixed(2)),
    currentRate,
    effectiveRate: Number(effectiveRate.toFixed(2)),
    diffAmount: Number(diffAmount.toFixed(2)),
    diffPercent: Number(diffPercent.toFixed(2)),
    totalCostAtBase: Number(totalCostAtBase.toFixed(2)),
    totalCostAtCurrent: Number(totalCostAtCurrent.toFixed(2)),
    totalVariance: Number(totalVariance.toFixed(2)),
    status,
  };
}

export interface GovernmentMaterialRule {
  code: string;
  name: string;
  category: string;
  unit: string;
  baseRate: number;
  spec?: string;
  isStandardRef?: string;
  governmentSchedule?: string;
}

/**
 * Standard Government DSR / Maharashtra PWD / IS Code Material Rules catalog
 */
export const GOVERNMENT_DSR_MATERIAL_BUNDLE: GovernmentMaterialRule[] = [
  // Maharashtra PWD State Schedule Rates
  {
    code: "MH-PWD-3.01",
    name: "OPC 53 Grade Cement (Maharashtra PWD)",
    category: "Concrete & Masonry",
    unit: "bag",
    baseRate: 380,
    spec: "Conforming to IS 269:2015 Clause 5.1 (Nashik/Mumbai Circle Rate)",
    isStandardRef: "IS 269:2015 Clause 5.1",
    governmentSchedule: "Maharashtra PWD SSR Item 3.01",
  },
  {
    code: "MH-PWD-3.02",
    name: "Portland Pozzolana Cement PPC (Maharashtra PWD)",
    category: "Concrete & Masonry",
    unit: "bag",
    baseRate: 350,
    spec: "Conforming to IS 1489 (Part 1):2015",
    isStandardRef: "IS 1489:2015",
    governmentSchedule: "Maharashtra PWD SSR Item 3.02",
  },
  {
    code: "MH-PWD-5.22",
    name: "TMT Steel Fe-500D Reinforcement Bars (Maha PWD)",
    category: "Metals & Steel",
    unit: "kg",
    baseRate: 68.5,
    spec: "High yield strength deformed bars conforming to IS 1786:2008 Grade Fe500D",
    isStandardRef: "IS 1786:2008 Clause 6.1",
    governmentSchedule: "Maharashtra PWD SSR Item 5.22",
  },
  {
    code: "MH-PWD-3.05",
    name: "Coarse Aggregate 20mm Crushed Basalt (Maha PWD)",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1180,
    spec: "Crushed hard basalt stone aggregate conforming to IS 383:2016 Table 2",
    isStandardRef: "IS 383:2016 Table 2",
    governmentSchedule: "Maharashtra PWD SSR Item 3.05",
  },
  {
    code: "MH-PWD-3.08",
    name: "Natural River Sand Zone II (Maharashtra PWD / MJP)",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1750,
    spec: "Naturally well-graded river sand conforming to IS 383:2016 Zone II",
    isStandardRef: "IS 383:2016 Zone II",
    governmentSchedule: "Maharashtra PWD SSR Item 3.08 / MJP Item 47",
  },
  {
    code: "MH-PWD-3.09",
    name: "Manufactured Sand M-Sand (Maharashtra PWD)",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1400,
    spec: "Crushed stone sand as per IS 383:2016 for concrete",
    isStandardRef: "IS 383:2016 Clause 4.2",
    governmentSchedule: "Maharashtra PWD SSR Item 3.09",
  },
  {
    code: "MH-PWD-6.01",
    name: "First Class Burnt Clay Bricks 10 N/mm² (Maha PWD)",
    category: "Concrete & Masonry",
    unit: "1000 nos",
    baseRate: 7800,
    spec: "Compressive strength not less than 10 N/mm² conforming to IS 1077:1992",
    isStandardRef: "IS 1077:1992 Table 1",
    governmentSchedule: "Maharashtra PWD SSR Item 6.01",
  },
  {
    code: "MH-PWD-4.13",
    name: "Ready Mix Concrete M25 Grade (Maha PWD)",
    category: "Concrete & Masonry",
    unit: "m³",
    baseRate: 4250,
    spec: "Design mix concrete M25 as per IS 456:2000 and IS 4926",
    isStandardRef: "IS 456:2000 Cl 9.2",
    governmentSchedule: "Maharashtra PWD SSR Item 4.13",
  },

  // CPWD Delhi Schedule Rates
  {
    code: "CPWD-DSR-3.1",
    name: "Ordinary Portland Cement (OPC 53 Grade)",
    category: "Concrete & Masonry",
    unit: "bag",
    baseRate: 380,
    spec: "Conforming to IS 269:2015, 50kg bag",
    isStandardRef: "IS 269:2015 Clause 5.1",
    governmentSchedule: "CPWD DSR 2023 Item 3.1",
  },
  {
    code: "CPWD-DSR-3.2",
    name: "Portland Pozzolana Cement (PPC)",
    category: "Concrete & Masonry",
    unit: "bag",
    baseRate: 350,
    spec: "Conforming to IS 1489 (Part 1):2015",
    isStandardRef: "IS 1489:2015 Clause 4.2",
    governmentSchedule: "CPWD DSR 2023 Item 3.2",
  },
  {
    code: "CPWD-DSR-5.22",
    name: "TMT Steel Fe-500D Reinforcement Bars",
    category: "Metals & Steel",
    unit: "kg",
    baseRate: 68,
    spec: "High yield strength deformed bars conforming to IS 1786:2008",
    isStandardRef: "IS 1786:2008 Clause 6.1",
    governmentSchedule: "CPWD DSR 2023 Item 5.22",
  },
  {
    code: "CPWD-DSR-5.23",
    name: "TMT Steel Fe-550D High Ductility Bars",
    category: "Metals & Steel",
    unit: "kg",
    baseRate: 71,
    spec: "Earthquake resistant steel bars as per IS 1786:2008",
    isStandardRef: "IS 1786:2008 Annexure B",
    governmentSchedule: "CPWD DSR 2023 Item 5.23",
  },
  {
    code: "CPWD-DSR-3.5",
    name: "Coarse Aggregate 20mm Nominal Size",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1150,
    spec: "Crushed stone aggregate conforming to IS 383:2016 Table 2",
    isStandardRef: "IS 383:2016 Table 2",
    governmentSchedule: "CPWD DSR 2023 Item 3.5",
  },
  {
    code: "CPWD-DSR-3.6",
    name: "Coarse Aggregate 10mm Nominal Size",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1250,
    spec: "Crushed stone aggregate conforming to IS 383:2016 Table 2",
    isStandardRef: "IS 383:2016 Table 2",
    governmentSchedule: "CPWD DSR 2023 Item 3.6",
  },
  {
    code: "CPWD-DSR-3.8",
    name: "Fine Aggregate / River Sand (Zone II)",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1650,
    spec: "Naturally well-graded river sand conforming to IS 383:2016 Zone II",
    isStandardRef: "IS 383:2016 Zone II",
    governmentSchedule: "CPWD DSR 2023 Item 3.8",
  },
  {
    code: "CPWD-DSR-3.9",
    name: "Manufactured Sand (M-Sand)",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1350,
    spec: "Crushed stone sand as per IS 383:2016 for concrete",
    isStandardRef: "IS 383:2016 Clause 4.2",
    governmentSchedule: "CPWD DSR 2023 Item 3.9",
  },
  {
    code: "CPWD-DSR-6.1",
    name: "First Class Burnt Clay Bricks (Class 10)",
    category: "Concrete & Masonry",
    unit: "1000 nos",
    baseRate: 7500,
    spec: "Compressive strength not less than 10 N/mm² conforming to IS 1077",
    isStandardRef: "IS 1077:1992 Table 1",
    governmentSchedule: "CPWD DSR 2023 Item 6.1",
  },
  {
    code: "CPWD-DSR-6.4",
    name: "AAC Blocks (Autoclaved Aerated Concrete 600 kg/m³)",
    category: "Concrete & Masonry",
    unit: "m³",
    baseRate: 3200,
    spec: "Precast AAC masonry units as per IS 2185 (Part 3):2021",
    isStandardRef: "IS 2185:2021 Part 3",
    governmentSchedule: "CPWD DSR 2023 Item 6.4",
  },
  {
    code: "CPWD-DSR-4.1.3",
    name: "Ready Mix Concrete M25 Grade",
    category: "Concrete & Masonry",
    unit: "m³",
    baseRate: 4100,
    spec: "Design mix concrete M25 as per IS 456:2000 and IS 4926",
    isStandardRef: "IS 456:2000 Cl 9.2",
    governmentSchedule: "CPWD DSR 2023 Item 4.1.3",
  },
  {
    code: "CPWD-DSR-4.1.5",
    name: "Ready Mix Concrete M30 Grade",
    category: "Concrete & Masonry",
    unit: "m³",
    baseRate: 4400,
    spec: "Design mix concrete M30 as per IS 456:2000 Table 5",
    isStandardRef: "IS 456:2000 Table 5",
    governmentSchedule: "CPWD DSR 2023 Item 4.1.5",
  },
  {
    code: "CPWD-DSR-12.1",
    name: "Structural Steel Sections (Beams, Channels, Angles)",
    category: "Metals & Steel",
    unit: "kg",
    baseRate: 75,
    spec: "Conforming to IS 2062:2011 Grade E250 Quality A",
    isStandardRef: "IS 2062:2011 Grade E250",
    governmentSchedule: "CPWD DSR 2023 Item 12.1",
  },
  {
    code: "CPWD-DSR-11.2",
    name: "Vitrified Floor Tiles (600x600 mm Premium Grade)",
    category: "Finishes",
    unit: "m²",
    baseRate: 650,
    spec: "Double charged vitrified tiles as per IS 15622:2017",
    isStandardRef: "IS 15622:2017 Group BIa",
    governmentSchedule: "CPWD DSR 2023 Item 11.2",
  },
  {
    code: "CPWD-DSR-13.1",
    name: "Premium Acrylic Emulsion Paint",
    category: "Finishes",
    unit: "litre",
    baseRate: 280,
    spec: "Interior washable wall paint conforming to IS 15489",
    isStandardRef: "IS 15489:2004",
    governmentSchedule: "CPWD DSR 2023 Item 13.1",
  }
];

/**
 * Extract / parse material items from raw text (e.g. copied or extracted from PDF government schedule)
 */
export function parseMaterialTextOrPdf(rawText: string): GovernmentMaterialRule[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: GovernmentMaterialRule[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/(?:item|code|dsr|is|mh-pwd)?[:\s]*([A-Z0-9.\/-]+)\s+([A-Za-z0-9\s(),.\-–]+?)\s+(?:unit[:\s]*)?(bag|kg|m³|m2|m²|m|cum|sqm|tonne|litre|liter|piece|nos|1000 nos)\s+(?:rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]+)?)/i);

    if (match) {
      const code = match[1].toUpperCase();
      const name = match[2].trim();
      const unit = match[3].toLowerCase();
      const rate = parseFloat(match[4].replace(/,/g, ""));

      let category = "Miscellaneous";
      const nameLower = name.toLowerCase();
      if (nameLower.includes("cement") || nameLower.includes("concrete") || nameLower.includes("brick") || nameLower.includes("block")) {
        category = "Concrete & Masonry";
      } else if (nameLower.includes("steel") || nameLower.includes("bar") || nameLower.includes("tmt") || nameLower.includes("iron")) {
        category = "Metals & Steel";
      } else if (nameLower.includes("sand") || nameLower.includes("aggregate") || nameLower.includes("stone") || nameLower.includes("gravel")) {
        category = "Aggregates";
      } else if (nameLower.includes("tile") || nameLower.includes("paint") || nameLower.includes("plaster") || nameLower.includes("marble")) {
        category = "Finishes";
      } else if (nameLower.includes("wood") || nameLower.includes("timber") || nameLower.includes("plywood")) {
        category = "Timber & Formwork";
      }

      items.push({
        code,
        name,
        category,
        unit,
        baseRate: rate,
        spec: `Extracted from PDF schedule (${line.slice(0, 50)})`,
        governmentSchedule: "Imported PDF Government Schedule",
      });
    }
  }

  return items;
}
