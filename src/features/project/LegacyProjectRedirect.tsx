import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useProjectUiStore } from "./projectUiStore";
import { projectPath, type ProjectScopedPage } from "./projectRoutes";

interface LegacyOrScopedPageProps {
  page: ProjectScopedPage;
  children: ReactNode;
}

/** When a project is active, redirect flat /boq → /projects/:id/boq for shareable URLs. */
export function LegacyOrScopedPage({ page, children }: LegacyOrScopedPageProps) {
  const activeProjectId = useProjectUiStore((s) => s.activeProjectId);
  if (activeProjectId) {
    return <Navigate to={projectPath(activeProjectId, page)} replace />;
  }
  return children;
}
