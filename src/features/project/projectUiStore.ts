import { create } from "zustand";

interface ProjectUiState {
  activeProjectId: string | null;
  measurementTableFilter: string;
  setActiveProjectId: (id: string | null) => void;
  setMeasurementTableFilter: (q: string) => void;
}

export const useProjectUiStore = create<ProjectUiState>((set) => ({
  activeProjectId: null,
  measurementTableFilter: "",
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setMeasurementTableFilter: (measurementTableFilter) => set({ measurementTableFilter }),
}));
