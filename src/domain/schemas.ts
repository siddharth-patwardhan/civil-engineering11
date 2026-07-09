import { z } from "zod";

/**
 * Civil / QS units for measurement books (Indian & international practice).
 * Extend here + formula.ts + UI together.
 */
export const MEASUREMENT_UNITS = [
  // Length
  "mm",
  "cm",
  "m",
  "km",
  "rm",
  "rmt",
  "ft",
  // Area
  "mm²",
  "cm²",
  "m²",
  "sft",
  "ha",
  "acre",
  // Volume
  "mm³",
  "cm³",
  "m³",
  "cum",
  "cft",
  "litre",
  // Count / numbers
  "nos",
  "each",
  "set",
  "pair",
  "lot",
  // Mass
  "g",
  "kg",
  "qtl",
  "t",
  "tonne",
  "MT",
  // Civil materials
  "bag",
  "roll",
  "sheet",
  "bundle",
  "rebar",
  // Lump sum / time
  "ls",
  "job",
  "hour",
  "day",
] as const;

export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const measurementUnitSchema = z.enum(MEASUREMENT_UNITS);

/** Equipment rental / productivity units (subset + time-based). */
export const EQUIPMENT_UNITS = ["day", "hour", "job", "m³", "m²", "nos", "ls"] as const;
export type EquipmentUnit = (typeof EQUIPMENT_UNITS)[number];
export const equipmentUnitSchema = z.enum(EQUIPMENT_UNITS);

export function coerceMeasurementUnit(unit: unknown): MeasurementUnit {
  const p = measurementUnitSchema.safeParse(unit);
  if (p.success) return p.data;
  // Legacy aliases from older BOQ / imports
  const aliases: Record<string, MeasurementUnit> = {
    "r.m.": "rm",
    "r.m": "rm",
    "sqft": "sft",
    "sq.ft": "sft",
    "ft²": "sft",
    "ft2": "sft",
    "ft³": "cft",
    "ft3": "cft",
    "cum.": "cum",
    "cubic metre": "m³",
    "cubic meter": "m³",
    "L": "litre",
    "ltr": "litre",
    "quintal": "qtl",
    "mt": "MT",
    "MTon": "MT",
    "numbers": "nos",
    "no": "nos",
    "no.": "nos",
    "ea": "each",
    "lump sum": "ls",
    "man-day": "day",
    "manday": "day",
  };
  if (typeof unit === "string" && aliases[unit]) return aliases[unit];
  return "m³";
}

const VOLUME_UNITS = new Set<MeasurementUnit>(["mm³", "cm³", "m³", "cum", "cft", "litre"]);
const AREA_UNITS = new Set<MeasurementUnit>(["mm²", "cm²", "m²", "sft", "ha", "acre"]);
const LINEAR_UNITS = new Set<MeasurementUnit>(["mm", "cm", "m", "km", "rm", "rmt", "ft"]);
const MASS_UNITS = new Set<MeasurementUnit>(["g", "kg", "qtl", "t", "tonne", "MT"]);

/** Units that represent bulk fill / concrete volume in BOQ chain */
export function isVolumeUnit(unit: string): boolean {
  return VOLUME_UNITS.has(unit as MeasurementUnit);
}

export function isAreaUnit(unit: string): boolean {
  return AREA_UNITS.has(unit as MeasurementUnit);
}

export function isLinearUnit(unit: string): boolean {
  return LINEAR_UNITS.has(unit as MeasurementUnit);
}

export function isMassUnit(unit: string): boolean {
  return MASS_UNITS.has(unit as MeasurementUnit);
}

/** Short labels + search keywords for dropdowns (value stays canonical). */
export const MEASUREMENT_UNIT_LABELS: Record<MeasurementUnit, string> = {
  mm: "mm — millimetre (length / rebar dia)",
  cm: "cm — centimetre",
  m: "m — metre",
  km: "km — kilometre",
  rm: "rm — running metre (No.×L)",
  rmt: "rmt — running metre (Indian QS)",
  ft: "ft — foot (length)",
  "mm²": "mm² — square millimetre",
  "cm²": "cm² — square centimetre",
  "m²": "m² — square metre",
  sft: "sft — square foot",
  ha: "ha — hectare",
  acre: "acre — acre",
  "mm³": "mm³ — cubic millimetre",
  "cm³": "cm³ — cubic centimetre",
  "m³": "m³ — cubic metre",
  cum: "cum — cubic metre (1000 L)",
  cft: "cft — cubic foot",
  litre: "litre — litre (L)",
  nos: "nos — numbers / count",
  each: "each — per item",
  set: "set — set of items",
  pair: "pair — pair",
  lot: "lot — lot",
  g: "g — gram",
  kg: "kg — kilogram",
  qtl: "qtl — quintal (100 kg)",
  t: "t — metric tonne",
  tonne: "tonne — metric tonne",
  MT: "MT — metric ton",
  bag: "bag — cement bag (50 kg)",
  roll: "roll — roll (wire mesh, geo)",
  sheet: "sheet — plywood / formwork",
  bundle: "bundle — rebar bundle",
  rebar: "rebar — steel bar (D²/162×L kg)",
  ls: "ls — lump sum",
  job: "job — lump sum job",
  hour: "hour — man-hour / machine-hour",
  day: "day — man-day / rental day",
};

export const EQUIPMENT_UNIT_LABELS: Record<EquipmentUnit, string> = {
  day: "day — per day rental",
  hour: "hour — per hour",
  job: "job — per job / mobilization",
  "m³": "m³ — per cubic metre",
  "m²": "m² — per square metre",
  nos: "nos — per number",
  ls: "ls — lump sum",
};

/** Filter units by search query (matches code or label). */
export function filterUnits<T extends string>(
  units: readonly T[],
  labels: Record<T, string>,
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...units];
  return units.filter((u) => u.toLowerCase().includes(q) || labels[u].toLowerCase().includes(q));
}

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

/** Editable BOQ line for sync (id optional for new rows). */
export const boqLineInputSchema = z.object({
  id: z.string().optional(),
  itemNo: z.string(),
  description: z.string(),
  unit: z.string(),
  quantity: z.number().finite().nonnegative(),
  rate: z.number().finite().nonnegative(),
  amount: z.number().finite().nonnegative(),
});

export type BoqLineInput = z.infer<typeof boqLineInputSchema>;

export const boqLinesSyncBodySchema = z.object({
  lines: z.array(boqLineInputSchema).min(1),
});

export type BoqLinesSyncBody = z.infer<typeof boqLinesSyncBodySchema>;

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

export const equipmentInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  rentalRate: z.number().finite().nonnegative(),
  unit: equipmentUnitSchema,
  capacity: z.string().optional(),
});

export type EquipmentInput = z.infer<typeof equipmentInputSchema>;

export const rateAnalysisInputSchema = z.object({
  name: z.string().min(1),
  materialCost: z.number().finite().nonnegative(),
  labourCost: z.number().finite().nonnegative(),
  equipmentCost: z.number().finite().nonnegative(),
  overheadPct: z.number().finite().nonnegative().max(100).optional(),
  profitPct: z.number().finite().nonnegative().max(100).optional(),
  boqLineId: z.string().uuid().optional(),
});

export type RateAnalysisInput = z.infer<typeof rateAnalysisInputSchema>;

export const materialInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  spec: z.string().optional(),
  rate: z.number().finite().nonnegative().optional(),
});

export type MaterialInput = z.infer<typeof materialInputSchema>;

export const labourInputSchema = z.object({
  name: z.string().min(1),
  dailyRate: z.number().finite().nonnegative(),
  unit: z.enum(["day", "hour", "job"]).default("day"),
  skillLevel: z.enum(["skilled", "unskilled", "semi_skilled"]).default("semi_skilled"),
  productivityUnit: z.string().optional(),
  productivityRate: z.number().finite().nonnegative().optional(),
});

export type LabourInput = z.infer<typeof labourInputSchema>;

export const boqApplyRateSchema = z.object({
  rateBookItemId: z.string().uuid(),
  boqLineId: z.string().uuid(),
});

export type BoqApplyRateInput = z.infer<typeof boqApplyRateSchema>;

export const approvalTransitionSchema = z.object({
  state: z.enum(["DRAFT", "SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"]),
  note: z.string().optional(),
});

const orgRoleSchema = z.enum([
  "SUPER_ADMIN",
  "PROJECT_MANAGER",
  "ESTIMATOR",
  "SITE_ENGINEER",
  "VIEWER",
  "CLIENT",
]);

export const signInSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(120).optional(),
});

export const signInSetupSchema = z.object({
  name: z.string().min(1).max(120),
  jobTitle: z.string().min(1).max(120),
  phone: z.string().max(30).optional(),
  orgName: z.string().min(1).max(200),
  registrationId: z.string().max(80).optional(),
  contactEmail: z.string().email().max(254),
  orgPhone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().length(2).default("IN"),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AUD"]).default("INR"),
  taxRate: z.number().finite().min(0).max(100).default(18),
  unitSystem: z.enum(["metric", "imperial"]).default("metric"),
  precision: z.number().int().min(1).max(4).default(2),
  isStandardsDefault: z.string().min(1).max(80).default("IS 456:2000"),
  orgRole: orgRoleSchema.default("SUPER_ADMIN"),
});

export const orgProfileUpdateSchema = z.object({
  orgName: z.string().min(1).max(200).optional(),
  registrationId: z.string().max(80).optional(),
  contactEmail: z.string().email().max(254).optional(),
  orgPhone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().length(2).optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AUD"]).optional(),
  taxRate: z.number().finite().min(0).max(100).optional(),
  unitSystem: z.enum(["metric", "imperial"]).optional(),
  precision: z.number().int().min(1).max(4).optional(),
  isStandardsDefault: z.string().min(1).max(80).optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignInSetupInput = z.infer<typeof signInSetupSchema>;
export type OrgProfileUpdateInput = z.infer<typeof orgProfileUpdateSchema>;
