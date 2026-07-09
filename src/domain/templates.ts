import type { MeasurementUnit } from "./schemas";

export interface ElementTemplate {
  key: string;
  label: string;
  /** Default row values when inserting from template */
  defaults: {
    desc: string;
    unit: MeasurementUnit;
    no: string;
    l: string;
    w: string;
    h: string;
  };
  /** Curated IS rule ids (see prisma seed / is_standards) */
  relatedStandardIds?: string[];
}

export const ELEMENT_TEMPLATES: ElementTemplate[] = [
  {
    key: "excavation_trench",
    label: "Excavation — trench",
    defaults: {
      desc: "Bulk excavation trench",
      unit: "m³",
      no: "1",
      l: "10",
      w: "1.2",
      h: "1.5",
    },
  },
  {
    key: "rcc_column",
    label: "RCC Column",
    defaults: {
      desc: "RCC rectangular column",
      unit: "m³",
      no: "4",
      l: "0.3",
      w: "0.45",
      h: "3.0",
    },
    relatedStandardIds: ["seed-is456-cover-column", "seed-is456-grade-mild"],
  },
  {
    key: "rcc_beam",
    label: "RCC Beam",
    defaults: {
      desc: "RCC beam",
      unit: "m³",
      no: "2",
      l: "4.5",
      w: "0.23",
      h: "0.45",
    },
    relatedStandardIds: ["seed-is456-cover-beam"],
  },
  {
    key: "slab_solid",
    label: "Solid slab",
    defaults: {
      desc: "RCC solid slab",
      unit: "m³",
      no: "1",
      l: "4",
      w: "5",
      h: "0.15",
    },
    relatedStandardIds: ["seed-is456-cover-slab"],
  },
  {
    key: "brickwork",
    label: "Brickwork (area)",
    defaults: {
      desc: "230mm brick wall",
      unit: "m²",
      no: "1",
      l: "10",
      w: "3",
      h: "",
    },
  },
  {
    key: "pipe_culvert_rm",
    label: "Pipe / culvert (running metre)",
    defaults: {
      desc: "600mm NP3 pipe supply & lay",
      unit: "rm",
      no: "12",
      l: "4.5",
      w: "",
      h: "",
    },
  },
  {
    key: "rebar_dia_mm",
    label: "Rebar — weight from dia (mm) × length (m)",
    defaults: {
      desc: "HYSD bar T16 — weight calc D²/162×L",
      unit: "rebar",
      no: "16",
      l: "12",
      w: "",
      h: "",
    },
  },
  {
    key: "formwork_area",
    label: "Formwork / shuttering (m²)",
    defaults: {
      desc: "Timber formwork to soffit",
      unit: "m²",
      no: "1",
      l: "4",
      w: "5",
      h: "",
    },
  },
  {
    key: "rebar_by_tonne",
    label: "Reinforcement (tonne — qty in No.)",
    defaults: {
      desc: "HYSD steel reinforcement",
      unit: "t",
      no: "2.5",
      l: "",
      w: "",
      h: "",
    },
  },
  {
    key: "cement_bags",
    label: "Cement (bags)",
    defaults: {
      desc: "OPC 53 Grade cement",
      unit: "bag",
      no: "850",
      l: "",
      w: "",
      h: "",
    },
  },
];
