import { Outlet } from "react-router-dom";
import { ProjectRouteSync } from "./useActiveProjectId";

/** Layout for /projects/:projectId/* — syncs URL param to store, renders child route. */
export function ProjectScopedLayout() {
  return (
    <>
      <ProjectRouteSync />
      <Outlet />
    </>
  );
}
