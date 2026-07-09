export type ProjectScopedPage =
  | "measurement"
  | "boq"
  | "rates"
  | "materials"
  | "labour"
  | "reports";

const LEGACY_PATHS: Record<ProjectScopedPage, string> = {
  measurement: "/measurement",
  boq: "/boq",
  rates: "/rates",
  materials: "/materials",
  labour: "/labour",
  reports: "/reports",
};

/** Build a project-scoped deep link, e.g. /projects/{id}/measurement */
export function projectPath(projectId: string, page: ProjectScopedPage): string {
  return `/projects/${projectId}/${page}`;
}

/** Prefer project-scoped URL when a project is active; otherwise legacy flat path. */
export function projectPathOrLegacy(
  projectId: string | null | undefined,
  page: ProjectScopedPage,
): string {
  return projectId ? projectPath(projectId, page) : LEGACY_PATHS[page];
}

export function legacyPathFor(page: ProjectScopedPage): string {
  return LEGACY_PATHS[page];
}

/** Map a legacy nav path to its scoped page key, if applicable. */
export function scopedPageFromLegacyPath(path: string): ProjectScopedPage | null {
  for (const [page, legacy] of Object.entries(LEGACY_PATHS) as [ProjectScopedPage, string][]) {
    if (path === legacy) return page;
  }
  return null;
}
