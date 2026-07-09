import { useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { useProjectUiStore } from "@/features/project/projectUiStore";

/** Establishes dev auth + default project when API and DB are available (development only). */
export function AppBootstrap() {
  const { isAuthenticated, isLoading, needsSetup, session, refresh } = useAuth();
  const setActiveProjectId = useProjectUiStore((s) => s.setActiveProjectId);

  useEffect(() => {
    if (!import.meta.env.DEV || isLoading) return;

    let cancelled = false;
    void (async () => {
      try {
        if (!isAuthenticated) {
          const data = await api.devSession();
          if (cancelled) return;
          await refresh();
          if (!data.needsSetup && data.defaultProjectId) {
            setActiveProjectId(data.defaultProjectId);
          }
          return;
        }
        if (needsSetup) return;
        if (session?.defaultProjectId) {
          setActiveProjectId(session.defaultProjectId);
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
  }, [isAuthenticated, isLoading, needsSetup, session, refresh, setActiveProjectId]);

  return null;
}
