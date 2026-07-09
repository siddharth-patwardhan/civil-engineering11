import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectUiState {
  activeProjectId: string | null;
  measurementTableFilter: string;
  setActiveProjectId: (id: string | null) => void;
  setMeasurementTableFilter: (q: string) => void;
}

export const useProjectUiStore = create<ProjectUiState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      measurementTableFilter: "",
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      setMeasurementTableFilter: (measurementTableFilter) => set({ measurementTableFilter }),
    }),
    {
      name: "civil-project-ui",
      partialize: (s) => ({ activeProjectId: s.activeProjectId }),
    },
  ),
);
