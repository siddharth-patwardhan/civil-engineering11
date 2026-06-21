import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { DataTable, Column } from "@/components/DataTable";
import { showToast } from "@/components/ToastProvider";
import { api } from "@/services/api";
import { cn } from "../lib/utils";

interface BoqLineRow {
  id: string;
  itemNo: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  section?: string;
  editable?: boolean;
}

export default function BOQNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeProjectId = useProjectUiStore((s) => s.activeProjectId);

  /* Fetch from server */
  const { data: boqData } = useQuery({
    queryKey: ["boq-versions", activeProjectId],
    queryFn: () =>
      api.fetch<{
        versions: {
          id: string;
          version: number;
          label: string | null;
          lines: BoqLineRow[];
        }[];
      }>(`/api/projects/${activeProjectId}/boq/versions`),
    enabled: Boolean(activeProjectId && api.getToken()),
  });

  const latest = boqData?.versions?.[0];

  /* Local editable state with undo/redo */
  const initialLines = useMemo(() => {
    return (latest?.lines ?? []).map((l) => ({ ...l, editable: true }));
  }, [latest]);

  const { state: lines, set: setLines, undo, redo, canUndo, canRedo } = useUndoRedo(initialLines);

  /* Computed totals */
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.amount, 0), [lines]);
  const contingency = subtotal * 0.05;
  const tax = subtotal * 0.15;
  const grandTotal = subtotal + contingency + tax;

  /* Format helpers */
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
  const fmtNum = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

  /* Update helpers */
  const updateLine = useCallback(
    (id: string, patch: Partial<BoqLineRow>) => {
      setLines((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l, ...patch };
          if (patch.quantity != null || patch.rate != null) {
            next.amount = next.quantity * next.rate;
          }
          return next;
        })
      );
    },
    [setLines]
  );

  const addLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        itemNo: `${prev.length + 1}.01`,
        description: "New item",
        unit: "m³",
        quantity: 0,
        rate: 0,
        amount: 0,
        editable: true,
      },
    ]);
  }, [setLines]);

  const deleteLine = useCallback(
    (id: string) => {
      setLines((prev) => prev.filter((l) => l.id !== id));
      showToast("Item deleted (Ctrl+Z to undo)", "info");
    },
    [setLines]
  );

  /* Keyboard shortcuts */
  useKeyboardShortcuts({
    "ctrl+z": undo,
    "ctrl+shift+z": redo,
  }, [undo, redo]);

  /* Columns */
  const columns: Column<BoqLineRow>[] = useMemo(
    () => [
      {
        key: "itemNo",
        header: "Item #",
        width: 80,
        render: (row) => (
          <input
            value={row.itemNo}
            onChange={(e) => updateLine(row.id, { itemNo: e.target.value })}
            className="w-full bg-transparent border-none outline-none text-text-muted font-mono text-mono focus:ring-0"
          />
        ),
      },
      {
        key: "description",
        header: "Description",
        width: "1fr",
        render: (row) => (
          <input
            value={row.description}
            onChange={(e) => updateLine(row.id, { description: e.target.value })}
            className="w-full bg-transparent border-none outline-none text-text-primary font-table text-table focus:ring-0"
          />
        ),
      },
      {
        key: "unit",
        header: "Unit",
        width: 80,
        align: "center",
        render: (row) => (
          <input
            value={row.unit}
            onChange={(e) => updateLine(row.id, { unit: e.target.value })}
            className="w-full bg-transparent border-none outline-none text-text-primary font-mono text-mono text-center focus:ring-0"
          />
        ),
      },
      {
        key: "quantity",
        header: "Qty",
        width: 100,
        align: "right",
        render: (row) => (
          <input
            type="number"
            value={row.quantity}
            onChange={(e) => updateLine(row.id, { quantity: Number(e.target.value) })}
            className="w-full bg-transparent border-none outline-none text-text-primary font-mono text-mono text-right focus:ring-0"
          />
        ),
      },
      {
        key: "rate",
        header: "Rate",
        width: 120,
        align: "right",
        render: (row) => (
          <input
            type="number"
            value={row.rate}
            onChange={(e) => updateLine(row.id, { rate: Number(e.target.value) })}
            className="w-full bg-transparent border-none outline-none text-text-primary font-mono text-mono text-right focus:ring-0"
          />
        ),
      },
      {
        key: "amount",
        header: "Amount",
        width: 140,
        align: "right",
        render: (row) => (
          <span className="font-mono text-mono text-text-primary font-semibold">{fmtCurrency(row.amount)}</span>
        ),
      },
      {
        key: "actions",
        header: "",
        width: 48,
        align: "center",
        render: (row) => (
          <button
            onClick={() => deleteLine(row.id)}
            className="h-7 w-7 flex items-center justify-center rounded text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        ),
      },
    ],
    [updateLine, deleteLine]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-text-primary">Bill of Quantities</h1>
          <p className="font-body text-body text-text-secondary mt-1">
            Detailed line-item breakdown for cost estimation and material procurement
          </p>
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
            onClick={addLine}
            className="h-8 px-3 rounded-lg border border-border-default text-text-primary font-table text-table hover:bg-bg-hover transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Item
          </button>
          <button
            onClick={() => window.print()}
            className="h-8 px-3 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Version badge */}
      <div className="flex items-center gap-3">
        <span className="px-2 py-1 rounded-full bg-bg-elevated border border-border-default font-mono text-mono text-text-muted">
          {latest ? `v${latest.version}${latest.label ? ` — ${latest.label}` : ""}` : "Draft (unsaved)"}
        </span>
        <span className="px-2 py-1 rounded-full bg-status-warning font-label text-label">Pending Approval</span>
      </div>

      {/* BOQ Table */}
      <DataTable
        columns={columns}
        data={lines}
        keyExtractor={(row) => row.id}
        emptyMessage="No BOQ items. Add items or generate from Measurement Book."
      />

      {/* Summary */}
      <div className="flex justify-end">
        <div className="w-full sm:w-[400px] bg-bg-surface border border-border-default rounded-lg p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-table text-table text-text-secondary">Subtotal</span>
            <span className="font-mono text-mono text-text-primary">{fmtCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-table text-table text-text-secondary">Contingency (5%)</span>
            <span className="font-mono text-mono text-text-primary">{fmtCurrency(contingency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-table text-table text-text-secondary">Tax / GST (15%)</span>
            <span className="font-mono text-mono text-text-primary">{fmtCurrency(tax)}</span>
          </div>
          <div className="border-t border-border-default pt-2 mt-1 flex justify-between items-center">
            <span className="font-h3 text-h3 text-text-primary">Grand Total</span>
            <span className="font-display text-display text-accent-primary">{fmtCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
