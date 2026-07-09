import type { MeasureRowInput } from "./schemas";
import { isAreaUnit, isLinearUnit, isMassUnit, isVolumeUnit } from "./schemas";

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
      error: "For length units: enter No. × Length, or No. only for a direct quantity.",
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
        error: "Rebar weight requires diameter (D as No. in mm) and length (L in m).",
      };
    }
    const wKg = (no * no) / 162 * l;
    return {
      ok: true,
      quantity: wKg,
      trace: { op, inputs: { no, l }, formula: "(D²/162)*L kg" },
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
  if (unit === "rebar") return "steel_weight";
  if (isAreaUnit(unit)) return "area";
  if (isLinearUnit(unit)) return "linear";
  if (isMassUnit(unit)) return "count";
  if (
    unit === "nos" ||
    unit === "each" ||
    unit === "set" ||
    unit === "pair" ||
    unit === "lot" ||
    unit === "bag" ||
    unit === "roll" ||
    unit === "sheet" ||
    unit === "bundle" ||
    unit === "ls" ||
    unit === "job" ||
    unit === "hour" ||
    unit === "day" ||
    unit === "litre"
  ) {
    return "count";
  }
  if (isVolumeUnit(unit)) return "volume";
  return "volume";
}
