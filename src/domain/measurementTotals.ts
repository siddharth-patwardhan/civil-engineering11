import type { QuantityResult } from "./formula";

export interface UnitSubtotal {
  unit: string;
  total: number;
  rowsWithError: number;
}

/**
 * Sums quantities **per unit** only. Mixing m³ + m² in one scalar is invalid; use this for footers.
 */
export function totalsByUnit<T extends { unit: string }>(
  rows: T[],
  quantityFor: (row: T) => QuantityResult,
): UnitSubtotal[] {
  const map = new Map<string, { total: number; rowsWithError: number }>();
  for (const row of rows) {
    const u = row.unit;
    const q = quantityFor(row);
    const cur = map.get(u) ?? { total: 0, rowsWithError: 0 };
    if (q.ok) cur.total += q.quantity;
    else cur.rowsWithError += 1;
    map.set(u, cur);
  }
  return [...map.entries()]
    .map(([unit, v]) => ({ unit, total: v.total, rowsWithError: v.rowsWithError }))
    .sort((a, b) => a.unit.localeCompare(b.unit));
}
