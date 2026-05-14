import { useEffect } from "react";
import { api } from "@/services/api";
import { useProjectUiStore } from "@/features/project/projectUiStore";

/** Establishes dev auth + default project when API and DB are available. */
export function AppBootstrap() {
  const setActiveProjectId = useProjectUiStore((s) => s.setActiveProjectId);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!api.getToken()) {
          const data = await api.devSession();
          if (cancelled) return;
          setActiveProjectId(data.defaultProjectId);
          return;
        }
        const { projects } = await api.fetch<{ projects: { id: string }[] }>("/api/projects");
        if (cancelled) return;
        setActiveProjectId(projects[0]?.id ?? null);
      } catch (e) {
        console.warn("[bootstrap] session/projects skipped:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setActiveProjectId]);

  return null;
}
