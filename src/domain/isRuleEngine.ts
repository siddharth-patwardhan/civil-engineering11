/**
 * Deterministic IS 456–oriented suggestions from curated rule ids (no LLM).
 * Pair with DB rows in `IsStandard`; this module encodes the same numeric defaults for offline tests.
 */

export type ElementKind = "beam" | "column" | "slab" | "footing";

export interface CoverRule {
  standardId: string;
  code: string;
  section: string;
  coverMm: number;
}

const COVER_BY_ELEMENT: Record<ElementKind, CoverRule> = {
  slab: {
    standardId: "seed-is456-cover-slab",
    code: "IS456",
    section: "26.4",
    coverMm: 20,
  },
  beam: {
    standardId: "seed-is456-cover-beam",
    code: "IS456",
    section: "26.4",
    coverMm: 25,
  },
  column: {
    standardId: "seed-is456-cover-column",
    code: "IS456",
    section: "26.4",
    coverMm: 40,
  },
  footing: {
    standardId: "seed-is456-cover-footing",
    code: "IS456",
    section: "26.4",
    coverMm: 50,
  },
};

export function nominalCoverForElement(kind: ElementKind): CoverRule {
  return COVER_BY_ELEMENT[kind];
}

export interface MinGradeRule {
  standardId: string;
  minGrade: string;
  note: string;
}

export function minConcreteGradeExposure(severe: boolean): MinGradeRule {
  if (severe) {
    return {
      standardId: "seed-is456-grade-severe",
      minGrade: "M30",
      note: "Severe exposure — verify with design mix and durability criteria.",
    };
  }
  return {
    standardId: "seed-is456-grade-mild",
    minGrade: "M20",
    note: "Mild environment baseline; confirm exposure class on project.",
  };
}
