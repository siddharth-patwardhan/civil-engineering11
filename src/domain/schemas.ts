import { z } from "zod";

/** Civil / QS units supported in the measurement book (extend here + formula + UI together). */
export const MEASUREMENT_UNITS = [
  "m³",
  "cum",
  "m²",
  "sft",
  "m",
  "rm",
  "nos",
  "kg",
  "t",
  "bag",
  "ls",
  "job",
] as const;

export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const measurementUnitSchema = z.enum(MEASUREMENT_UNITS);

export function coerceMeasurementUnit(unit: unknown): MeasurementUnit {
  const p = measurementUnitSchema.safeParse(unit);
  return p.success ? p.data : "m³";
}

/** Units that represent bulk fill / concrete volume in this demo BOQ chain */
export function isVolumeUnit(unit: string): boolean {
  return unit === "m³" || unit === "cum";
}

/** Short labels for dropdowns (value stays canonical). */
export const MEASUREMENT_UNIT_LABELS: Record<MeasurementUnit, string> = {
  "m³": "m³ (cubic metre)",
  cum: "cum (1000 L, same as m³)",
  "m²": "m² (square metre)",
  sft: "ft² (square foot)",
  m: "m (metre — use No.×L for r.m.)",
  rm: "r.m. (running metre = No.×L)",
  nos: "nos (numbers only)",
  kg: "kg (mass in No. column)",
  t: "t (tonne in No. column)",
  bag: "bag (cement bag count in No.)",
  ls: "ls (lump sum qty in No.)",
  job: "job (lump sum, same as ls)",
};

/** API / persistence shape for a measurement grid row */
export const measureRowInputSchema = z.object({
  id: z.string().min(1),
  desc: z.string(),
  no: z.string().optional().nullable(),
  l: z.string().optional().nullable(),
  w: z.string().optional().nullable(),
  h: z.string().optional().nullable(),
  unit: measurementUnitSchema,
  templateKey: z.string().optional().nullable(),
  formulaJson: z.unknown().optional().nullable(),
  deductionsJson: z.unknown().optional().nullable(),
});

export type MeasureRowInput = z.infer<typeof measureRowInputSchema>;

export const measurementSyncBodySchema = z.object({
  lines: z.array(measureRowInputSchema),
});

export type MeasurementSyncBody = z.infer<typeof measurementSyncBodySchema>;

export const boqLineSchema = z.object({
  itemNo: z.string(),
  description: z.string(),
  unit: z.string(),
  quantity: z.number().finite().nonnegative(),
  rate: z.number().finite().nonnegative(),
  amount: z.number().finite().nonnegative(),
});

export type BoqLineDTO = z.infer<typeof boqLineSchema>;

export const boqVersionCreateSchema = z.object({
  label: z.string().optional(),
});

export const projectCreateSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().optional(),
  location: z.string().optional(),
  tenderNumber: z.string().optional(),
  structureType: z.string().optional(),
  budgetEstimate: z.number().optional(),
  isStandardsVersion: z.string().optional(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const rateAnalysisInputSchema = z.object({
  name: z.string().min(1),
  materialCost: z.number().finite().nonnegative(),
  labourCost: z.number().finite().nonnegative(),
  equipmentCost: z.number().finite().nonnegative(),
  overheadPct: z.number().finite().nonnegative().max(100).optional(),
  profitPct: z.number().finite().nonnegative().max(100).optional(),
});

export type RateAnalysisInput = z.infer<typeof rateAnalysisInputSchema>;

export const approvalTransitionSchema = z.object({
  state: z.enum(["DRAFT", "SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"]),
  note: z.string().optional(),
});
