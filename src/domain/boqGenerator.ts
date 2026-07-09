import type { BoqLineDTO, MeasureRowInput } from "./schemas";
import { isAreaUnit, isMassUnit, isVolumeUnit } from "./schemas";
import { defaultOpForUnit, resolveQuantityStrict } from "./formula";

const EXCAVATION_RATE = 15;
const CONCRETE_RATE = 250;
const STEEL_PER_M3 = 0.1406;
const STEEL_RATE = 1800;
const SITE_CLEARANCE_QTY = 2500;
const SITE_CLEARANCE_RATE = 4;

function sumByUnitType(
  rows: MeasureRowInput[],
  predicate: (unit: string) => boolean,
): number {
  let total = 0;
  for (const row of rows) {
    if (!predicate(row.unit)) continue;
    const op = defaultOpForUnit(row.unit);
    const r = resolveQuantityStrict(row, op);
    if (r.ok) total += r.quantity;
  }
  return total;
}

/**
 * Deterministic BOQ lines from measurement book (excavation-linked demo categories).
 */
export function generateBoqFromMeasurements(rows: MeasureRowInput[]): BoqLineDTO[] {
  const excavationQty = sumByUnitType(rows, isVolumeUnit);
  const areaQty = sumByUnitType(rows, isAreaUnit);
  const steelFromRebar = sumByUnitType(rows, (u) => u === "rebar" || u === "kg");
  const steelFromMass = sumByUnitType(rows, isMassUnit);

  const concreteQty = excavationQty;
  const steelQty =
    steelFromRebar > 0
      ? steelFromRebar / 1000
      : steelFromMass > 0
        ? steelFromMass
        : concreteQty * STEEL_PER_M3;

  const siteClearanceQty = areaQty > 0 ? areaQty : SITE_CLEARANCE_QTY;

  return [
    {
      itemNo: "1.01",
      description: "Clear site of all vegetation, scrub, and debris.",
      unit: "m²",
      quantity: siteClearanceQty,
      rate: SITE_CLEARANCE_RATE,
      amount: siteClearanceQty * SITE_CLEARANCE_RATE,
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
      unit: "t",
      quantity: steelQty,
      rate: STEEL_RATE,
      amount: steelQty * STEEL_RATE,
    },
  ];
}
