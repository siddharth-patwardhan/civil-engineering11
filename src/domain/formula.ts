import type { MeasureRowInput } from "./schemas";

export type FormulaOp = "volume" | "area" | "count" | "steel_weight" | "linear";

export interface QuantityDerivationTrace {
  op: FormulaOp;
  inputs: { no?: number; l?: number; w?: number; h?: number };
  formula: string;
  rulePackVersion?: number;
}

export type QuantityResult =
  | { ok: true; quantity: number; trace: QuantityDerivationTrace }
  | { ok: false; error: string; trace?: Partial<QuantityDerivationTrace> };

function parseNum(s: string | null | undefined): number | null {
  if (s == null || String(s).trim() === "") return null;
  const n = parseFloat(String(s));
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolves quantity from explicit dimensions — no silent default of 1 for missing L/W/H.
 * For volume: all of no, l, w, h must be provided (or no alone for count-only lines).
 */
export function resolveQuantityStrict(
  row: Pick<MeasureRowInput, "no" | "l" | "w" | "h" | "unit">,
  op: FormulaOp = "volume",
): QuantityResult {
  const no = parseNum(row.no);
  const l = parseNum(row.l);
  const w = parseNum(row.w);
  const h = parseNum(row.h);

  const hasAnyDim = l != null || w != null || h != null;
  const allDims = l != null && w != null && h != null;

  if (op === "linear") {
    if (no != null && no >= 0 && l != null) {
      return {
        ok: true,
        quantity: no * l,
        trace: { op: "linear", inputs: { no, l }, formula: "N*L (running)" },
      };
    }
    if (no != null && no >= 0 && l == null) {
      return {
        ok: true,
        quantity: no,
        trace: { op: "linear", inputs: { no }, formula: "N (count / length total in No.)" },
      };
    }
    return {
      ok: false,
      error: "For r.m./m: enter No. × Length, or No. only for a direct quantity/count.",
    };
  }

  if (op === "count") {
    if (no == null || no < 0) {
      return { ok: false, error: "Count (No.) is required and must be non-negative." };
    }
    return {
      ok: true,
      quantity: no,
      trace: { op, inputs: { no }, formula: "N" },
    };
  }

  if (op === "steel_weight") {
    if (no == null || l == null) {
      return {
        ok: false,
        error: "Steel weight requires diameter (D as no) and length (L).",
      };
    }
    const wKg = (no * no) / 162 * l;
    return {
      ok: true,
      quantity: wKg,
      trace: { op, inputs: { no, l }, formula: "(D^2/162)*L" },
    };
  }

  if (op === "area") {
    if (no == null || l == null || w == null) {
      return {
        ok: false,
        error: "Area requires No., Length, and Width.",
      };
    }
    const q = no * l * w;
    return {
      ok: true,
      quantity: q,
      trace: { op, inputs: { no, l, w }, formula: "N*L*W" },
    };
  }

  // volume (default)
  if (!hasAnyDim) {
    if (no != null && no >= 0) {
      return { ok: true, quantity: no, trace: { op, inputs: { no }, formula: "N (no dimensions)" } };
    }
    return {
      ok: false,
      error: "Provide No. only, or full Length, Width, and Height for volume.",
    };
  }

  if (!allDims) {
    return {
      ok: false,
      error: "For volume, Length, Width, and Height must all be provided.",
    };
  }

  if (no == null || no < 0) {
    return {
      ok: false,
      error: "No. (multiplier/count) is required when Length, Width, and Height are set.",
    };
  }

  const quantity = no * l * w * h;
  return {
    ok: true,
    quantity,
    trace: { op: "volume", inputs: { no, l, w, h }, formula: "N*L*W*H" },
  };
}

/** Map unit to formula op (dims must match the physical meaning of the unit). */
export function defaultOpForUnit(unit: string): FormulaOp {
  if (unit === "m²" || unit === "sft") return "area";
  if (unit === "m" || unit === "rm") return "linear";
  if (unit === "nos" || unit === "kg" || unit === "t" || unit === "bag" || unit === "ls" || unit === "job") {
    return "count";
  }
  if (unit === "m³" || unit === "cum") return "volume";
  return "volume";
}
