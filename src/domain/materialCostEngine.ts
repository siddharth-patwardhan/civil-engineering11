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
 * Valid civil engineering measurement units whitelist
 */
export const VALID_CIVIL_UNITS = new Set([
  "m³",
  "m²",
  "m",
  "kg",
  "bag",
  "nos",
  "1000 nos",
  "tonne",
  "litre",
  "quintal",
]);

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
  },
];

/**
 * Helper to normalize unit text into standard measurement units
 */
export function normalizeUnitString(rawUnit: string): string | null {
  if (!rawUnit) return null;
  const u = rawUnit.toLowerCase().trim();
  if (u.includes("bag")) return "bag";
  if (u.includes("cubic m") || u.includes("m3") || u.includes("m³") || u.includes("cum") || u.includes("m´‡") || u.includes("m´")) return "m³";
  if (u.includes("square m") || u.includes("m2") || u.includes("m²") || u.includes("sqm") || u.includes("m´†")) return "m²";
  if (u.includes("metric ton") || u.includes("tonne") || u.includes("mt")) return "tonne";
  if (u.includes("1000")) return "1000 nos";
  if (u.includes("num") || u.includes("nos") || u.includes("each") || u.includes("per no") || u.includes("number")) return "nos";
  if (u.includes("kilo") || u.includes("kg")) return "kg";
  if (u.includes("litr") || u.includes("litre") || u.includes("liter") || u.includes("ltr")) return "litre";
  if (u.includes("quintal")) return "quintal";
  if (u.includes("running") || u.includes("rmt") || u.includes("rm") || u === "m" || u === "metre" || u === "meter") return "m";
  return null;
}

/**
 * Helper to infer material category from text context
 */
export function inferMaterialCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("surfacing") || t.includes("bituminous") || t.includes("bitumen") || t.includes("asphalt") || t.includes("ogc") || t.includes("dbm") || t.includes("bc")) {
    return "Road Surfacing & Asphalt";
  }
  if (t.includes("survey") || t.includes("dpr") || t.includes("testing") || t.includes("investigation")) {
    return "Survey & Consultancy";
  }
  if (t.includes("sub grade") || t.includes("earthwork") || t.includes("excavation") || t.includes("murum") || t.includes("soil") || t.includes("embankment")) {
    return "Earthwork & Subgrade";
  }
  if (t.includes("sub base") || t.includes("base course") || t.includes("wbm") || t.includes("macadam") || t.includes("gsb") || t.includes("wmm")) {
    return "Road Sub-Base & Base";
  }
  if (t.includes("cement") || t.includes("concrete") || t.includes("brick") || t.includes("block") || t.includes("masonry") || t.includes("rmc") || t.includes("mortar") || t.includes("plaster")) {
    return "Concrete & Masonry";
  }
  if (t.includes("steel") || t.includes("tmt") || t.includes("rebar") || t.includes("iron") || t.includes("beam") || t.includes("angle") || t.includes("channel") || t.includes("fe-500") || t.includes("fe-550")) {
    return "Metals & Steel";
  }
  if (t.includes("sand") || t.includes("aggregate") || t.includes("stone") || t.includes("gravel") || t.includes("boulder") || t.includes("rubble")) {
    return "Aggregates";
  }
  if (t.includes("tile") || t.includes("paint") || t.includes("flooring") || t.includes("finish") || t.includes("marble") || t.includes("granite")) {
    return "Finishes";
  }
  if (t.includes("pipe") || t.includes("plumbing") || t.includes("sanitary") || t.includes("valve") || t.includes("water")) {
    return "Plumbing & Piping";
  }
  if (t.includes("timber") || t.includes("formwork") || t.includes("shuttering") || t.includes("wood") || t.includes("plywood")) {
    return "Timber & Formwork";
  }
  return "Miscellaneous";
}

/**
 * Extract / parse material items from raw text or extracted PDF schedule text.
 * Supports official Maharashtra PWD SSR, MJP, CPWD DSR, and structured civil PDF tables.
 */
export function parseMaterialTextOrPdf(rawText: string): GovernmentMaterialRule[] {
  if (!rawText || typeof rawText !== "string") return [];

  // Clean delimiters and PDF font encoding artifacts
  const cleanText = rawText
    .replace(/\r/g, "")
    .replace(/m´‡/g, "m³")
    .replace(/m´†/g, "m²")
    .replace(/[·|]/g, " ")
    .replace(/\u00A0/g, " ");

  const lines = cleanText.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: GovernmentMaterialRule[] = [];
  const codeSet = new Set<string>();

  const UNIT_PATTERN = "(?:one\\s+cubic\\s+metr[ee]|one\\s+square\\s+metr[ee]|one\\s+metric\\s+tonne|one\\s+number|per\\s+bag|1000\\s+nos|per\\s+kg|per\\s+litre|per\\s+quintal|cubic\\s+metr[ee]|square\\s+metr[ee]|metric\\s+tonne|running\\s+metr[ee]|bag|kg|m³|m2|m²|m|cum|sqm|tonne|litre|liter|piece|nos|1000 nos|each)";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Filter out metadata noise, status lines, temp text, dates, component headers
    if (
      line.match(/^(temp|active|monthlyinr|\d+\s*components|jul|aug|sep|oct|nov|dec|jan|feb|mar|apr|may|jun)/i) ||
      line.match(/^(status|page\s+\d+|state\s+schedule|government\s+of|public\s+works\s+department|table\s+of\s+contents|index|chapter|\d{4}-\d{2})/i) ||
      line.match(/^(sr\.?\s*no|item\s+no|description|unit|rate\s*\(in\s*rs\)|gst\s*\(in\s*rs\))/i) ||
      (line.match(/schedule|department|government|catalog|dsr/i) && !line.match(new RegExp(UNIT_PATTERN, "i")) && !line.match(/Unit:/i))
    ) {
      continue;
    }

    // Pattern 1: Key-Value / Pipe Labeled PDF format
    // e.g. "[MH-PWD-MAT-01] Ordinary Portland Cement (OPC 53 Grade) | Unit: bag (50kg) | Base Rate: Rs.380 | Nashik: Rs.390 | Ref: Maharashtra PWD SSR"
    const kvMatch = line.match(/^\[?([A-Za-z0-9._\-]+)\]?\s+(.*?)\s*Unit:\s*(.*?)\s*Base\s+Rate:\s*(?:Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]+)?)(?:\\s+(.*))?/i);

    if (kvMatch) {
      const rawCode = kvMatch[1].trim();
      const rawName = kvMatch[2].replace(/\|/g, "").trim();
      const rawUnit = kvMatch[3].replace(/\|/g, "").trim();
      const rate = parseFloat(kvMatch[4].replace(/,/g, ""));
      const spec = kvMatch[5]?.replace(/\|/g, "").trim();

      const unit = normalizeUnitString(rawUnit);

      if (!isNaN(rate) && rate > 0 && rawName.length >= 3 && unit && VALID_CIVIL_UNITS.has(unit)) {
        if (rawName.match(/^(temp|active|monthlyinr|\d+\s*components)/i)) continue;

        let code = rawCode.match(/^(MH|CPWD|DSR|ITEM|SSR)/i) ? rawCode.toUpperCase() : `MH-PWD-${rawCode.toUpperCase()}`;
        if (codeSet.has(code)) code = `${code}-${items.length + 1}`;
        codeSet.add(code);

        const category = inferMaterialCategory(`${rawName} ${spec ?? ""}`);

        items.push({
          code,
          name: rawName,
          category,
          unit,
          baseRate: rate,
          spec: spec ? `Ref: ${spec}` : `Maharashtra PWD Schedule Item ${rawCode}`,
          governmentSchedule: "Maharashtra PWD / State Schedule of Rates",
        });
        continue;
      }
    }

    // Pattern 2: Single line match: Code (e.g. CPWD-3.1, MH-PWD-3.01, 103, 2.29b), Description, Unit, Rate
    const lineMatch = line.match(new RegExp(`^(?:item\\s*)?([A-Za-z0-9._\\-]+)\\s+(.*?)\\s+(${UNIT_PATTERN})\\s+(?:rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]+)?)(?:\\s+(.*))?`, "i"));

    if (lineMatch) {
      const rawCode = lineMatch[1].trim();
      const rawDesc = lineMatch[2].trim();
      const rawUnit = lineMatch[3].trim();
      const rate = parseFloat(lineMatch[4].replace(/,/g, ""));
      const spec = lineMatch[5]?.trim();

      const unit = normalizeUnitString(rawUnit);

      if (!isNaN(rate) && rate > 0 && rawDesc.length >= 3 && unit && VALID_CIVIL_UNITS.has(unit)) {
        if (rawDesc.match(/^(temp|active|monthlyinr|\d+\s*components)/i)) continue;

        let code = rawCode.match(/^(MH|CPWD|DSR|ITEM|SSR)/i) ? rawCode.toUpperCase() : `MH-PWD-${rawCode.toUpperCase()}`;
        if (codeSet.has(code)) code = `${code}-${items.length + 1}`;
        codeSet.add(code);

        let name = rawDesc.replace(/\s+/g, " ").trim();
        if (name.length > 120) name = name.slice(0, 117) + "…";

        const category = inferMaterialCategory(`${rawDesc} ${spec ?? ""}`);

        items.push({
          code,
          name,
          category,
          unit,
          baseRate: rate,
          spec: spec ? `Ref: ${spec}` : `Maharashtra PWD SSR Item ${rawCode}`,
          governmentSchedule: "Maharashtra PWD / State Schedule of Rates",
        });
        continue;
      }
    }

    // Pattern 3: Lookahead multiline format where description spans across line break (and next line does NOT start with item code)
    if (i + 1 < lines.length && !lines[i + 1].match(/^(?:CPWD|MH|DSR|ITEM|SSR|\d{1,4}[.\s-])/i)) {
      const combined = `${line} ${lines[i + 1]}`;
      const multiMatch = combined.match(new RegExp(`^(?:item\\s*)?([A-Za-z0-9._\\-]+)?\\s*(.*?)\\s+(${UNIT_PATTERN})\\s+(?:rs\\.?|₹)?\\s*([0-9,]+(?:\.[0-9]+)?)`, "i"));

      if (multiMatch && multiMatch[2].trim().length >= 5) {
        const rawCode = multiMatch[1]?.trim() || `ITEM-${items.length + 1}`;
        const rawDesc = multiMatch[2].trim();
        const rawUnit = multiMatch[3].trim();
        const rate = parseFloat(multiMatch[4].replace(/,/g, ""));

        const unit = normalizeUnitString(rawUnit);

        if (!isNaN(rate) && rate > 0 && unit && VALID_CIVIL_UNITS.has(unit)) {
          if (rawDesc.match(/^(temp|active|monthlyinr|\d+\s*components)/i)) continue;

          let code = rawCode.match(/^(MH|CPWD|DSR|ITEM|SSR)/i) ? rawCode.toUpperCase() : `MH-PWD-${rawCode.toUpperCase()}`;
          if (codeSet.has(code)) code = `${code}-${items.length + 1}`;
          codeSet.add(code);

          let name = rawDesc.replace(/\s+/g, " ").trim();
          if (name.length > 120) name = name.slice(0, 117) + "…";

          const category = inferMaterialCategory(`${rawDesc} ${name}`);

          items.push({
            code,
            name,
            category,
            unit,
            baseRate: rate,
            spec: `Maharashtra PWD SSR Item ${rawCode}`,
            governmentSchedule: "Maharashtra PWD State Schedule of Rates",
          });
          i++; // skip next line as it was merged
        }
      }
    }
  }

  return items;
}
