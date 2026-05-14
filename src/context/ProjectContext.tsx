import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  defaultOpForUnit,
  resolveQuantityStrict,
  type QuantityResult,
} from "@/domain/formula";
import type { MeasureRowInput, MeasurementUnit } from "@/domain/schemas";
import { coerceMeasurementUnit } from "@/domain/schemas";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { api } from "@/services/api";

export interface MeasureRow {
  id: string;
  desc: string;
  no: string;
  l: string;
  w: string;
  h: string;
  unit: MeasurementUnit;
  templateKey?: string | null;
}

const STORAGE_KEY = "draftMeasureRows";

const defaultRows: MeasureRow[] = [
  { id: "1", desc: "Main Trench Segment A", no: "2", l: "15.50", w: "1.20", h: "1.50", unit: "m³" },
  { id: "2", desc: "Side Footings", no: "4", l: "2.00", w: "2.00", h: "1.00", unit: "m³" },
];

interface ProjectContextType {
  measureRows: MeasureRow[];
  setMeasureRows: React.Dispatch<React.SetStateAction<MeasureRow[]>>;
  calculateQty: (row: MeasureRow) => number;
  quantityResult: (row: MeasureRow) => QuantityResult;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  pullFromServer: () => Promise<void>;
  pushToServer: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

function rowsToInputs(rows: MeasureRow[]): MeasureRowInput[] {
  return rows.map((r) => ({
    id: r.id,
    desc: r.desc,
    no: r.no,
    l: r.l,
    w: r.w,
    h: r.h,
    unit: r.unit,
    templateKey: r.templateKey,
  }));
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const activeProjectId = useProjectUiStore((s) => s.activeProjectId);
  const setActiveProjectIdStore = useProjectUiStore((s) => s.setActiveProjectId);

  const [measureRows, setMeasureRows] = useState<MeasureRow[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as unknown[];
        if (Array.isArray(parsed)) {
          return parsed.map((raw) => {
            const r = raw as MeasureRow;
            return { ...r, unit: coerceMeasurementUnit(r.unit) };
          });
        }
      } catch (e) {
        console.error("Failed to parse saved draft rows", e);
      }
    }
    return defaultRows;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(measureRows));
  }, [measureRows]);

  const quantityResult = useCallback((r: MeasureRow): QuantityResult => {
    const op = defaultOpForUnit(r.unit);
    return resolveQuantityStrict(r, op);
  }, []);

  const calculateQty = useCallback(
    (r: MeasureRow) => {
      const q = quantityResult(r);
      return q.ok ? q.quantity : 0;
    },
    [quantityResult],
  );

  const setActiveProjectId = useCallback(
    (id: string | null) => {
      setActiveProjectIdStore(id);
    },
    [setActiveProjectIdStore],
  );

  const pullFromServer = useCallback(async () => {
    if (!activeProjectId || !api.getToken()) {
      throw new Error("Select a project and sign in (dev session) first.");
    }
    const res = await api.fetch<{ lines: MeasureRow[] }>(
      `/api/projects/${activeProjectId}/measurements`,
    );
    setMeasureRows(
      res.lines.map((l) => ({
        id: l.id,
        desc: l.desc,
        no: l.no ?? "",
        l: l.l ?? "",
        w: l.w ?? "",
        h: l.h ?? "",
        unit: coerceMeasurementUnit(l.unit),
        templateKey: l.templateKey,
      })),
    );
  }, [activeProjectId]);

  const pushToServer = useCallback(async () => {
    if (!activeProjectId || !api.getToken()) {
      throw new Error("Select a project and sign in (dev session) first.");
    }
    await api.fetch(`/api/projects/${activeProjectId}/measurements`, {
      method: "PUT",
      body: JSON.stringify({ lines: rowsToInputs(measureRows) }),
    });
  }, [activeProjectId, measureRows]);

  return (
    <ProjectContext.Provider
      value={{
        measureRows,
        setMeasureRows,
        calculateQty,
        quantityResult,
        activeProjectId,
        setActiveProjectId,
        pullFromServer,
        pushToServer,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
