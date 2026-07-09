import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProject, MeasureRow } from "../context/ProjectContext";
import { useActiveProjectId } from "@/features/project/useActiveProjectId";
import { projectPathOrLegacy } from "@/features/project/projectRoutes";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { type Column } from "@/components/DataTable";
import { VirtualDataTable } from "@/components/VirtualDataTable";
import { MobileMeasureForm } from "@/components/MobileMeasureForm";
import { UnitCombobox } from "@/components/UnitCombobox";
import { showToast } from "@/components/ToastProvider";
import { cn } from "../lib/utils";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { ELEMENT_TEMPLATES } from "@/domain/templates";
import {
  MEASUREMENT_UNITS,
  MEASUREMENT_UNIT_LABELS,
  filterUnits,
  type MeasurementUnit,
} from "@/domain/schemas";
import { totalsByUnit } from "@/domain/measurementTotals";

interface IsStandard {
  id: string;
  code: string;
  section: string;
  category: string;
  title: string;
  value: unknown;
  formula?: string | null;
  notes?: string | null;
  unit?: string | null;
}

type AutoSaveStatus = "idle" | "saving" | "saved";

export default function MeasurementNew() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const activeProjectId = useActiveProjectId();
  const { measureRows: serverRows, quantityResult, pushToServer, pullFromServer } = useProject();

  const { data: projectData } = useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => api.fetch<{ project: { name: string } }>(`/api/projects/${activeProjectId}`),
    enabled: Boolean(activeProjectId && isAuthenticated),
  });

  const skipAutoSaveRef = useRef(true);

  useEffect(() => {
    if (!activeProjectId) {
      skipAutoSaveRef.current = true;
      return;
    }
    skipAutoSaveRef.current = true;
    pullFromServer()
      .catch((err) => showToast(`Failed to load measurements: ${err}`, "error"))
      .finally(() => {
        window.setTimeout(() => {
          skipAutoSaveRef.current = false;
        }, 0);
      });
  }, [activeProjectId, pullFromServer]);

  const syncKey = `${activeProjectId ?? "none"}:${serverRows.length}:${serverRows[0]?.id ?? ""}`;
  const { state: rows, set: setRows, undo, redo, canUndo, canRedo } = useUndoRedo(serverRows, 50, syncKey);

  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [activeStandardIds, setActiveStandardIds] = useState<string[] | null>(null);
  const [standardsPanelOpen, setStandardsPanelOpen] = useState(true);

  const { data: standardsData, isLoading: standardsLoading } = useQuery({
    queryKey: ["is-standards"],
    queryFn: () => api.fetch<{ standards: IsStandard[] }>("/api/is-standards"),
    enabled: Boolean(activeStandardIds?.length && isAuthenticated),
  });

  const matchingStandards = useMemo(() => {
    if (!activeStandardIds?.length || !standardsData?.standards) return [];
    const idSet = new Set(activeStandardIds);
    return standardsData.standards.filter((s) => idSet.has(s.id));
  }, [activeStandardIds, standardsData]);

  const debouncedAutoSave = useDebouncedCallback(async (rowsToSave: MeasureRow[]) => {
    if (!activeProjectId) return;
    setAutoSaveStatus("saving");
    try {
      await pushToServer(rowsToSave);
      setAutoSaveStatus("saved");
    } catch {
      setAutoSaveStatus("idle");
    }
  }, 2000);

  useEffect(() => {
    if (!activeProjectId || skipAutoSaveRef.current) return;
    debouncedAutoSave(rows);
  }, [rows, activeProjectId, debouncedAutoSave]);

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedRowId(null);
      return;
    }
    if (!selectedRowId || !rows.some((r) => r.id === selectedRowId)) {
      setSelectedRowId(rows[rows.length - 1]?.id ?? null);
    }
  }, [rows, selectedRowId]);

  const syncToServer = useCallback(
    async (rowsToSave = rows) => {
      if (!activeProjectId) {
        showToast("Select a project first", "error");
        return false;
      }
      setIsSaving(true);
      try {
        await pushToServer(rowsToSave);
        showToast("Measurements saved", "success");
        setAutoSaveStatus("saved");
        return true;
      } catch (err) {
        showToast(String(err), "error");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [activeProjectId, pushToServer, rows],
  );

  const goToBoq = useCallback(async () => {
    const ok = await syncToServer();
    if (ok) navigate(projectPathOrLegacy(activeProjectId, "boq"));
  }, [syncToServer, navigate, activeProjectId]);

  useKeyboardShortcuts(
    {
      "ctrl+z": undo,
      "ctrl+shift+z": redo,
      "ctrl+s": (e) => {
        e.preventDefault();
        void syncToServer();
      },
    },
    [undo, redo, syncToServer],
  );

  const addRow = useCallback(() => {
    const id = Date.now().toString();
    setRows((prev) => [
      ...prev,
      { id, desc: "", no: "", l: "", w: "", h: "", ded: "", unit: "m³" },
    ]);
    setSelectedRowId(id);
  }, [setRows]);

  const updateField = useCallback(
    (id: string, field: keyof MeasureRow, value: string) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    },
    [setRows],
  );

  const deleteRow = useCallback(
    (id: string) => {
      setRows((prev) => prev.filter((r) => r.id !== id));
      showToast("Row deleted (Ctrl+Z to undo)", "info");
    },
    [setRows],
  );

  const addFromTemplate = useCallback(
    (key: string) => {
      const t = ELEMENT_TEMPLATES.find((x) => x.key === key);
      if (!t) return;
      const id = Date.now().toString();
      setRows((prev) => [
        ...prev,
        {
          id,
          desc: t.defaults.desc,
          no: t.defaults.no,
          l: t.defaults.l,
          w: t.defaults.w,
          h: t.defaults.h,
          ded: "",
          unit: t.defaults.unit,
          templateKey: t.key,
        },
      ]);
      setSelectedRowId(id);
      if (t.relatedStandardIds?.length) {
        setActiveStandardIds(t.relatedStandardIds);
        setStandardsPanelOpen(true);
      } else {
        setActiveStandardIds(null);
      }
    },
    [setRows],
  );

  const unitTotals = useMemo(
    () => totalsByUnit(rows, (r) => quantityResult(r)),
    [rows, quantityResult],
  );

  const quantityLabel = useCallback(
    (row: MeasureRow) => {
      const res = quantityResult(row);
      return res.ok ? res.quantity.toFixed(2) : "—";
    },
    [quantityResult],
  );

  const columns: Column<MeasureRow>[] = useMemo(
    () => [
      {
        key: "desc",
        header: "Description",
        width: 280,
        render: (row) => (
          <input
            value={row.desc}
            onChange={(e) => updateField(row.id, "desc", e.target.value)}
            className="w-full bg-transparent border-none outline-none text-text-primary font-table text-table focus:ring-0 placeholder:text-text-muted"
            placeholder="Item description..."
          />
        ),
      },
      {
        key: "no",
        header: "No.",
        width: 70,
        align: "center",
        render: (row) => (
          <input
            type="number"
            value={row.no}
            onChange={(e) => updateField(row.id, "no", e.target.value)}
            className="w-full bg-transparent border-none outline-none text-text-primary font-mono text-mono text-center focus:ring-0"
          />
        ),
      },
      {
        key: "l",
        header: "L",
        width: 80,
        align: "center",
        render: (row) => (
          <input
            type="number"
            value={row.l}
            onChange={(e) => updateField(row.id, "l", e.target.value)}
            className="w-full bg-transparent border-none outline-none text-text-primary font-mono text-mono text-center focus:ring-0"
          />
        ),
      },
      {
        key: "w",
        header: "W",
        width: 80,
        align: "center",
        render: (row) => (
          <input
            type="number"
            value={row.w}
            onChange={(e) => updateField(row.id, "w", e.target.value)}
            className="w-full bg-transparent border-none outline-none text-text-primary font-mono text-mono text-center focus:ring-0"
          />
        ),
      },
      {
        key: "h",
        header: "H",
        width: 80,
        align: "center",
        render: (row) => (
          <input
            type="number"
            value={row.h}
            onChange={(e) => updateField(row.id, "h", e.target.value)}
            className="w-full bg-transparent border-none outline-none text-text-primary font-mono text-mono text-center focus:ring-0"
          />
        ),
      },
      {
        key: "ded",
        header: "Ded.",
        width: 80,
        align: "center",
        render: (row) => (
          <input
            type="number"
            value={row.ded}
            onChange={(e) => updateField(row.id, "ded", e.target.value)}
            className="w-full bg-transparent border-none outline-none text-text-primary font-mono text-mono text-center focus:ring-0"
          />
        ),
      },
      {
        key: "qty",
        header: "Quantity",
        width: 100,
        align: "right",
        render: (row) => {
          const res = quantityResult(row);
          return (
            <div className="flex flex-col items-end">
              <span
                className={cn(
                  "font-mono text-mono",
                  res.ok ? "text-accent-primary font-semibold" : "text-text-muted",
                )}
              >
                {res.ok ? res.quantity.toFixed(2) : "—"}
              </span>
              {!res.ok && (
                <span className="text-[10px] text-accent-danger leading-tight">{res.error}</span>
              )}
            </div>
          );
        },
      },
      {
        key: "unit",
        header: "Unit",
        width: 110,
        align: "center",
        render: (row) => (
          <UnitCombobox
            value={row.unit}
            units={MEASUREMENT_UNITS}
            labels={MEASUREMENT_UNIT_LABELS}
            filterUnits={filterUnits}
            onChange={(u) => updateField(row.id, "unit", u as MeasurementUnit)}
          />
        ),
      },
      {
        key: "actions",
        header: "",
        width: 48,
        align: "center",
        render: (row) => (
          <button
            onClick={() => deleteRow(row.id)}
            className="h-7 w-7 flex items-center justify-center rounded text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
            title="Delete row"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        ),
      },
    ],
    [updateField, deleteRow, quantityResult],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label text-label text-text-muted">
              {activeProjectId ? `Project ${activeProjectId.slice(0, 8)}…` : "No project selected"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-status-neutral font-label text-label">Draft</span>
          </div>
          <h1 className="font-h1 text-h1 text-text-primary mt-1">
            {projectData?.project?.name ?? "Measurement Book"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {activeProjectId && autoSaveStatus !== "idle" && (
            <span className="text-[11px] text-text-muted font-label">
              {autoSaveStatus === "saving" ? "Saving..." : "Auto-saved"}
            </span>
          )}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="h-8 px-3 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 transition-colors font-table text-table"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="h-8 px-3 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 transition-colors font-table text-table"
          >
            Redo
          </button>
          <button
            onClick={() => void syncToServer()}
            disabled={isSaving || !activeProjectId}
            className="h-8 px-3 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {!activeProjectId && (
        <div className="bg-status-warning/10 border border-status-warning rounded-lg px-4 py-3 font-table text-table text-text-secondary">
          Open a project from{" "}
          <button onClick={() => navigate("/projects")} className="text-accent-primary hover:underline">
            Projects
          </button>{" "}
          to save measurements.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              addFromTemplate(e.target.value);
              e.target.value = "";
            }
          }}
          className="h-9 px-3 rounded-lg bg-bg-input border border-border-default text-text-primary font-table text-table"
        >
          <option value="">Add from template...</option>
          {ELEMENT_TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="h-9 px-3 rounded-lg border border-border-default text-text-primary font-table text-table hover:bg-bg-hover transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Row
          </button>
          <button
            onClick={() => void goToBoq()}
            disabled={!activeProjectId}
            className="h-9 px-3 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            Review BOQ
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {activeStandardIds && (
        <div className="border border-border-default rounded-lg bg-bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => setStandardsPanelOpen((open) => !open)}
            className="w-full flex items-center justify-between px-4 py-2.5 font-table text-table text-text-primary hover:bg-bg-hover transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-accent-primary">menu_book</span>
              Related IS standards
              {!standardsLoading && (
                <span className="text-text-muted text-[11px]">({matchingStandards.length})</span>
              )}
            </span>
            <span className="material-symbols-outlined text-[20px] text-text-muted">
              {standardsPanelOpen ? "expand_less" : "expand_more"}
            </span>
          </button>
          {standardsPanelOpen && (
            <div className="px-4 pb-3 pt-0 border-t border-border-default flex flex-col gap-2">
              {standardsLoading && (
                <p className="font-table text-table text-text-muted py-2">Loading standards…</p>
              )}
              {!standardsLoading && matchingStandards.length === 0 && (
                <p className="font-table text-table text-text-muted py-2">No matching standards found.</p>
              )}
              {matchingStandards.map((s) => (
                <div key={s.id} className="py-2 border-b border-border-default last:border-b-0">
                  <div className="font-table text-table text-text-primary">
                    <span className="font-semibold">{s.code}</span>
                    <span className="text-text-muted"> §{s.section}</span>
                    <span className="text-text-secondary"> — {s.title}</span>
                  </div>
                  {s.notes && (
                    <p className="text-[11px] text-text-muted mt-0.5">{s.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="hidden lg:block">
        <VirtualDataTable
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          emptyMessage="No measurement rows. Add a row or select a template."
        />
      </div>

      <MobileMeasureForm
        rows={rows}
        selectedId={selectedRowId}
        onSelect={setSelectedRowId}
        onUpdate={updateField}
        onAdd={addRow}
        quantityLabel={quantityLabel}
      />

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 bg-bg-surface border border-border-default rounded-lg p-4">
        <span className="font-label text-label text-text-muted uppercase">Subtotals</span>
        {unitTotals.map(({ unit, total, rowsWithError }) => (
          <div key={unit} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-display text-accent-primary leading-none">
                {total.toFixed(2)}
              </span>
              <span className="font-h2 text-h2 text-text-muted">{unit}</span>
            </div>
            {rowsWithError > 0 && (
              <span className="text-[11px] text-accent-danger leading-tight">
                {rowsWithError} row{rowsWithError > 1 ? "s" : ""} need valid dims
              </span>
            )}
          </div>
        ))}
        {unitTotals.length === 0 && (
          <span className="font-body text-body text-text-muted">—</span>
        )}
      </div>
    </div>
  );
}
