import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjectUiStore } from "./projectUiStore";

/** Resolves active project from URL param (preferred) or Zustand store. */
export function useActiveProjectId(): string | null {
  const { projectId } = useParams<{ projectId?: string }>();
  const storeId = useProjectUiStore((s) => s.activeProjectId);
  return projectId ?? storeId;
}

/** Syncs /projects/:projectId/* URL param into the global project store. */
export function ProjectRouteSync() {
  const { projectId } = useParams<{ projectId: string }>();
  const setActiveProjectId = useProjectUiStore((s) => s.setActiveProjectId);

  useEffect(() => {
    if (projectId) setActiveProjectId(projectId);
  }, [projectId, setActiveProjectId]);

  return null;
}
