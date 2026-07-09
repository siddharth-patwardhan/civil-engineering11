import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import {
  defaultOpForUnit,
  resolveQuantityStrict,
  type QuantityResult,
} from "@/domain/formula";
import type { MeasureRowInput, MeasurementUnit } from "@/domain/schemas";
import { coerceMeasurementUnit } from "@/domain/schemas";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { useAuth } from "@/features/auth/AuthProvider";
import { api } from "@/services/api";

export interface MeasureRow {
  id: string;
  desc: string;
  no: string;
  l: string;
  w: string;
  h: string;
  ded: string;
  unit: MeasurementUnit;
  templateKey?: string | null;
}

function draftKey(projectId: string | null): string {
  return projectId ? `draftMeasureRows:${projectId}` : "draftMeasureRows:pending";
}

const defaultRows: MeasureRow[] = [
  { id: "1", desc: "Main Trench Segment A", no: "2", l: "15.50", w: "1.20", h: "1.50", ded: "", unit: "m³" },
  { id: "2", desc: "Side Footings", no: "4", l: "2.00", w: "2.00", h: "1.00", ded: "", unit: "m³" },
];

interface ProjectContextType {
  measureRows: MeasureRow[];
  setMeasureRows: React.Dispatch<React.SetStateAction<MeasureRow[]>>;
  calculateQty: (row: MeasureRow) => number;
  quantityResult: (row: MeasureRow) => QuantityResult;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  pullFromServer: () => Promise<void>;
  pushToServer: (rows?: MeasureRow[]) => Promise<void>;
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
    deductionsJson: r.ded && parseFloat(r.ded) > 0 ? { deduction: parseFloat(r.ded) } : undefined,
  }));
}

function parseDeduction(deductionsJson: unknown): string {
  if (deductionsJson && typeof deductionsJson === "object" && "deduction" in deductionsJson) {
    const d = (deductionsJson as { deduction?: number }).deduction;
    return d != null ? String(d) : "";
  }
  return "";
}

function loadDraft(projectId: string | null): MeasureRow[] | null {
  const saved = localStorage.getItem(draftKey(projectId));
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as unknown[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map((raw) => {
      const r = raw as MeasureRow;
            return { ...r, unit: coerceMeasurementUnit(r.unit), ded: r.ded ?? "" };
    });
  } catch {
    return null;
  }
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const activeProjectId = useProjectUiStore((s) => s.activeProjectId);
  const setActiveProjectIdStore = useProjectUiStore((s) => s.setActiveProjectId);
  const prevProjectRef = useRef<string | null>(null);

  const [measureRows, setMeasureRows] = useState<MeasureRow[]>(defaultRows);

  // Load project-scoped draft when active project changes
  useEffect(() => {
    if (prevProjectRef.current === activeProjectId) return;
    prevProjectRef.current = activeProjectId;
    const draft = loadDraft(activeProjectId);
    if (draft && draft.length > 0) {
      setMeasureRows(draft);
    } else if (!activeProjectId) {
      setMeasureRows(defaultRows);
    }
  }, [activeProjectId]);

  // Persist draft per project
  useEffect(() => {
    if (!activeProjectId) return;
    localStorage.setItem(draftKey(activeProjectId), JSON.stringify(measureRows));
  }, [measureRows, activeProjectId]);

  const quantityResult = useCallback((r: MeasureRow): QuantityResult => {
    const op = defaultOpForUnit(r.unit);
    const base = resolveQuantityStrict(r, op);
    if (!base.ok) return base;
    const ded = parseFloat(r.ded);
    if (!Number.isFinite(ded) || ded <= 0) return base;
    const quantity = Math.max(0, base.quantity - ded);
    return {
      ok: true,
      quantity,
      trace: {
        ...base.trace,
        formula: `${base.trace.formula} - ${ded} (deduction)`,
      },
    };
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
    if (!activeProjectId || !isAuthenticated) {
      throw new Error("Select a project and sign in (dev session) first.");
    }
    const res = await api.fetch<{ lines: MeasureRow[] }>(
      `/api/projects/${activeProjectId}/measurements`,
    );
    const rows = res.lines.map((l) => ({
      id: l.id,
      desc: l.desc,
      no: l.no ?? "",
      l: l.l ?? "",
      w: l.w ?? "",
      h: l.h ?? "",
      ded: parseDeduction((l as { deductionsJson?: unknown }).deductionsJson),
      unit: coerceMeasurementUnit(l.unit),
      templateKey: l.templateKey,
    }));
    setMeasureRows(rows.length > 0 ? rows : [{ id: Date.now().toString(), desc: "", no: "", l: "", w: "", h: "", ded: "", unit: "m³" as MeasurementUnit }]);
  }, [activeProjectId, isAuthenticated]);

  const pushToServer = useCallback(
    async (overrideRows?: MeasureRow[]) => {
      if (!activeProjectId || !isAuthenticated) {
        throw new Error("Select a project and sign in (dev session) first.");
      }
      const toSave = overrideRows ?? measureRows;
      await api.fetch(`/api/projects/${activeProjectId}/measurements`, {
        method: "PUT",
        body: JSON.stringify({ lines: rowsToInputs(toSave) }),
      });
      if (overrideRows) {
        setMeasureRows(overrideRows);
      }
    },
    [activeProjectId, measureRows, isAuthenticated],
  );

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
