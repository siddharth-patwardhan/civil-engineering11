export interface RateBreakdownInput {
  materialCost: number;
  labourCost: number;
  equipmentCost: number;
  overheadPct?: number;
  profitPct?: number;
}

export interface RateBreakdownResult extends RateBreakdownInput {
  subtotalDirect: number;
  overheadAmount: number;
  profitAmount: number;
  totalRate: number;
}

/**
 * Rate = materials + labour + equipment + overhead + profit (on chosen base).
 * Overhead and profit apply to direct subtotal (M+L+E).
 */
export function computeRateBreakdown(input: RateBreakdownInput): RateBreakdownResult {
  const oh = input.overheadPct ?? 0;
  const pr = input.profitPct ?? 0;
  const subtotalDirect =
    input.materialCost + input.labourCost + input.equipmentCost;
  const overheadAmount = subtotalDirect * (oh / 100);
  const profitAmount = (subtotalDirect + overheadAmount) * (pr / 100);
  const totalRate = subtotalDirect + overheadAmount + profitAmount;
  return {
    ...input,
    overheadPct: oh,
    profitPct: pr,
    subtotalDirect,
    overheadAmount,
    profitAmount,
    totalRate,
  };
}
