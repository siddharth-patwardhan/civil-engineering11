import type { Prisma } from "@prisma/client";

export interface BoqLineRateUpdate {
  rate: number;
  quantity: number;
}

/** Recompute BOQ line amount after rate change. */
export function boqLineAfterRateUpdate(line: BoqLineRateUpdate, newRate: number) {
  const quantity = line.quantity;
  const rate = newRate;
  return { rate, amount: quantity * rate };
}

export type PrismaBoqLineUpdate = {
  rate: Prisma.Decimal;
  amount: Prisma.Decimal;
};
