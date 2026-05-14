import type { BoqLineDTO, MeasureRowInput } from "./schemas";
import { isVolumeUnit } from "./schemas";
import { resolveQuantityStrict } from "./formula";

const EXCAVATION_RATE = 15;
const CONCRETE_RATE = 250;
const STEEL_PER_M3 = 0.1406;
const STEEL_RATE = 1800;

/**
 * Deterministic BOQ lines from measurement book (excavation-linked demo categories).
 */
export function generateBoqFromMeasurements(rows: MeasureRowInput[]): BoqLineDTO[] {
  let excavationQty = 0;
  for (const row of rows) {
    if (!isVolumeUnit(row.unit)) continue;
    const r = resolveQuantityStrict(row, "volume");
    if (r.ok) excavationQty += r.quantity;
  }

  const concreteQty = excavationQty;
  const steelQty = concreteQty * STEEL_PER_M3;

  return [
    {
      itemNo: "1.01",
      description: "Clear site of all vegetation, scrub, and debris.",
      unit: "m²",
      quantity: 2500,
      rate: 4,
      amount: 2500 * 4,
    },
    {
      itemNo: "1.02",
      description: "Bulk excavation for foundations up to 2m depth.",
      unit: "m³",
      quantity: excavationQty,
      rate: EXCAVATION_RATE,
      amount: excavationQty * EXCAVATION_RATE,
    },
    {
      itemNo: "2.01",
      description: "In-situ concrete grade C30/37 in strip foundations.",
      unit: "m³",
      quantity: concreteQty,
      rate: CONCRETE_RATE,
      amount: concreteQty * CONCRETE_RATE,
    },
    {
      itemNo: "2.02",
      description: "High-yield reinforcing steel bars (T16-T20).",
      unit: "tonne",
      quantity: steelQty,
      rate: STEEL_RATE,
      amount: steelQty * STEEL_RATE,
    },
  ];
}
