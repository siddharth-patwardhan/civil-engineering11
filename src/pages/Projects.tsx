import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useProjectUiStore } from "@/features/project/projectUiStore";

type ProjectRow = {
  id: string;
  name: string;
  clientName: string | null;
  location: string | null;
  updatedAt: string;
};

export default function Projects() {
  const navigate = useNavigate();
  const setActiveProjectId = useProjectUiStore((s) => s.setActiveProjectId);

  const { data, isError, error, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.fetch<{ projects: ProjectRow[] }>("/api/projects"),
    enabled: Boolean(api.getToken()),
  });

  const projects = data?.projects ?? [];

  return (
    <>
      <div className="flex flex-col md:flex-row gap-gutter justify-between items-start md:items-center">
        <div className="flex md:hidden w-full justify-end mb-2">
          <button
            onClick={() => navigate("/create-project")}
            className="h-touch-target-min px-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center gap-2 font-label-caps text-label-caps shadow-sm hover:bg-[#3b39c6] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Project
          </button>
        </div>
        <div className="relative w-full md:max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search projects, clients..."
            className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-2 focus:border-primary focus:outline-none font-body-md text-body-md text-on-surface transition-all"
          />
        </div>

        <div className="flex items-center gap-gutter w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar mt-4 md:mt-0 justify-between">
          <div className="flex gap-base">
            <button className="h-10 px-4 rounded-full bg-surface-variant text-on-surface font-label-caps text-label-caps flex items-center justify-center whitespace-nowrap hover:bg-surface-dim transition-colors border border-outline-variant shrink-0">
              All Status
            </button>
            <button className="h-10 px-4 rounded-full bg-surface-container-lowest text-on-surface-variant font-label-caps text-label-caps flex items-center justify-center whitespace-nowrap border border-outline-variant hover:bg-surface-container-low transition-colors shrink-0">
              Commercial
            </button>
            <button className="h-10 px-4 rounded-full bg-surface-container-lowest text-on-surface-variant font-label-caps text-label-caps flex items-center justify-center whitespace-nowrap border border-outline-variant hover:bg-surface-container-low transition-colors shrink-0">
              Infrastructure
            </button>
          </div>
          <button
            onClick={() => navigate("/create-project")}
            className="hidden md:flex h-10 px-6 rounded-full bg-secondary text-on-secondary items-center justify-center gap-2 font-label-caps text-label-caps shadow-[0_4px_12px_rgba(68,66,227,0.3)] hover:bg-[#3b39c6] active:scale-95 transition-all ml-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Project
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="font-body-md text-on-surface-variant mt-stack-md">Loading projects…</p>
      )}
      {isError && (
        <p className="font-body-md text-error mt-stack-md">
          Could not load projects (database offline?). {String((error as Error)?.message ?? "")}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-gutter mt-stack-md pb-[80px] md:pb-0">
        {projects.length === 0 && !isLoading && !isError && (
          <p className="font-body-md text-on-surface-variant col-span-full">No projects yet.</p>
        )}
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md border-l-[4px] border-l-primary hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-1">
                  {p.clientName ?? "—"}
                </p>
                <h3 className="font-headline-md text-headline-md text-on-surface">{p.name}</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps">
                Active
              </span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">location_on</span>
              <span className="font-table-data text-table-data">{p.location ?? "—"}</span>
            </div>
            <div className="mt-auto pt-stack-sm border-t border-surface-container-high flex justify-end">
              <button
                onClick={() => {
                  setActiveProjectId(p.id);
                  navigate("/measurement");
                }}
                className="h-touch-target-min px-6 bg-secondary text-on-secondary rounded-lg font-table-data text-table-data hover:bg-[#3b39c6] transition-colors shadow-sm"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
