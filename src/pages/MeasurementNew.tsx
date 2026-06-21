import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProject, MeasureRow } from "../context/ProjectContext";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { DataTable, Column } from "@/components/DataTable";
import { showToast } from "@/components/ToastProvider";
import { cn } from "../lib/utils";
import { ELEMENT_TEMPLATES } from "@/domain/templates";
import { MEASUREMENT_UNITS, MEASUREMENT_UNIT_LABELS } from "@/domain/schemas";
import { totalsByUnit } from "@/domain/measurementTotals";

export default function MeasurementNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeProjectId = useProjectUiStore((s) => s.activeProjectId);
  const { measureRows: serverRows, calculateQty, quantityResult, pushToServer } = useProject();

  /* Undo/Redo wrapper around rows */
  const { state: rows, set: setRows, undo, redo, canUndo, canRedo } = useUndoRedo(serverRows);

  /* Sync to server on significant changes (debounced in production) */
  const syncToServer = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      await pushToServer();
      showToast("Measurements saved", "success");
    } catch (err) {
      showToast(String(err), "error");
    }
  }, [activeProjectId, pushToServer]);

  /* Keyboard shortcuts */
  useKeyboardShortcuts({
    "ctrl+z": undo,
    "ctrl+shift+z": redo,
    "ctrl+s": (e) => {
      e.preventDefault();
      void syncToServer();
    },
  }, [undo, redo, syncToServer]);

  /* Add row */
  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: Date.now().toString(), desc: "", no: "", l: "", w: "", h: "", unit: "m³" },
    ]);
  }, [setRows]);

  /* Update field */
  const updateField = useCallback(
    (id: string, field: keyof MeasureRow, value: string) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    },
    [setRows]
  );

  /* Delete row */
  const deleteRow = useCallback(
    (id: string) => {
      setRows((prev) => prev.filter((r) => r.id !== id));
      showToast("Row deleted (Ctrl+Z to undo)", "info");
    },
    [setRows]
  );

  /* Add from template */
  const addFromTemplate = useCallback(
    (key: string) => {
      const t = ELEMENT_TEMPLATES.find((x) => x.key === key);
      if (!t) return;
      setRows((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          desc: t.defaults.desc,
          no: t.defaults.no,
          l: t.defaults.l,
          w: t.defaults.w,
          h: t.defaults.h,
          unit: t.defaults.unit,
          templateKey: t.key,
        },
      ]);
    },
    [setRows]
  );

  /* Unit totals */
  const unitTotals = useMemo(
    () => totalsByUnit(rows, (r) => quantityResult(r)),
    [rows, quantityResult]
  );

  /* Columns */
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
        key: "qty",
        header: "Quantity",
        width: 100,
        align: "right",
        render: (row) => {
          const res = quantityResult(row);
          return (
            <div className="flex flex-col items-end">
              <span className={cn("font-mono text-mono", res.ok ? "text-accent-primary font-semibold" : "text-text-muted")}>
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
        width: 100,
        align: "center",
        render: (row) => (
          <select
            value={row.unit}
            onChange={(e) => updateField(row.id, "unit", e.target.value as MeasureRow["unit"])}
            className="w-full bg-transparent border-none outline-none text-text-primary font-table text-table text-center focus:ring-0 cursor-pointer"
          >
            {MEASUREMENT_UNITS.map((u) => (
              <option key={u} value={u}>
                {MEASUREMENT_UNIT_LABELS[u]}
              </option>
            ))}
          </select>
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
    [updateField, deleteRow, quantityResult]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label text-label text-text-muted">TASK CE-2024-01-A</span>
            <span className="px-2 py-0.5 rounded-full bg-status-neutral font-label text-label">Draft</span>
          </div>
          <h1 className="font-h1 text-h1 text-text-primary mt-1">Foundation Excavation</h1>
        </div>
        <div className="flex items-center gap-2">
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
            className="h-8 px-3 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Toolbar */}
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
            onClick={() => navigate("/boq")}
            className="h-9 px-3 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors flex items-center gap-2"
          >
            Review BOQ
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.id}
        emptyMessage="No measurement rows. Add a row or select a template."
      />

      {/* Footer totals */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 bg-bg-surface border border-border-default rounded-lg p-4">
        <span className="font-label text-label text-text-muted uppercase">Subtotals</span>
        {unitTotals.map(({ unit, total, rowsWithError }) => (
          <div key={unit} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-display text-accent-primary leading-none">{total.toFixed(2)}</span>
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
