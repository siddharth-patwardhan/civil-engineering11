import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { VirtualDataTable } from "@/components/VirtualDataTable";
import { type Column } from "@/components/DataTable";
import { UnitCombobox } from "@/components/UnitCombobox";
import { showToast } from "@/components/ToastProvider";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { useActiveProjectId } from "@/features/project/useActiveProjectId";
import { projectPathOrLegacy } from "@/features/project/projectRoutes";
import { formatInr } from "@/lib/formatCurrency";
import {
  MEASUREMENT_UNITS,
  MEASUREMENT_UNIT_LABELS,
  filterUnits,
  type MeasurementUnit,
} from "@/domain/schemas";

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

interface BoqVersion {
  id: string;
  version: number;
  label: string | null;
  lines: BoqLineRow[];
}

interface BoqDiff {
  added: string[];
  removed: string[];
  changed: { itemNo: string; field: string; from: string; to: string }[];
}

interface RateBookItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  rate: number;
}

interface RateBook {
  id: string;
  name: string;
  items: RateBookItem[];
}

type ApprovalState = "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED";

const APPROVAL_LABELS: Record<ApprovalState, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  REVIEWED: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const APPROVAL_STYLES: Record<ApprovalState, string> = {
  DRAFT: "bg-bg-elevated text-text-muted border-border-default",
  SUBMITTED: "bg-status-warning/15 text-status-warning border-status-warning/40",
  REVIEWED: "bg-accent-primary/10 text-accent-primary border-accent-primary/30",
  APPROVED: "bg-status-success/15 text-status-success border-status-success/40",
  REJECTED: "bg-accent-danger/10 text-accent-danger border-accent-danger/30",
};

const REGENERATE_CONFIRM_MSG =
  "This will create a NEW BOQ version from measurements. Manual edits on the current version will NOT carry over unless you save them first.\n\nContinue?";

export default function BOQNew() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const activeProjectId = useActiveProjectId();
  const [isSaving, setIsSaving] = useState(false);
  const [diffVersionA, setDiffVersionA] = useState("");
  const [diffVersionB, setDiffVersionB] = useState("");
  const [diffOpen, setDiffOpen] = useState(false);
  const [selectedBoqLineId, setSelectedBoqLineId] = useState("");
  const [selectedRateBookItemId, setSelectedRateBookItemId] = useState("");

  const { data: boqData, isLoading, isError, error } = useQuery({
    queryKey: ["boq-versions", activeProjectId],
    queryFn: () =>
      api.fetch<{ versions: BoqVersion[] }>(`/api/projects/${activeProjectId}/boq/versions`),
    enabled: Boolean(activeProjectId && isAuthenticated),
  });

  const versions = boqData?.versions ?? [];
  const latest = versions[0];

  const { data: approvalsData } = useQuery({
    queryKey: ["approvals", activeProjectId],
    queryFn: () =>
      api.fetch<{
        approvals: { id: string; entityType: string; entityId: string; state: ApprovalState }[];
      }>(`/api/projects/${activeProjectId}/approvals`),
    enabled: Boolean(activeProjectId && isAuthenticated),
  });

  const currentApproval = useMemo(() => {
    if (!latest) return null;
    return (
      approvalsData?.approvals.find(
        (a) => a.entityType === "BoqVersion" && a.entityId === latest.id,
      ) ?? null
    );
  }, [approvalsData, latest]);

  const approvalState: ApprovalState = currentApproval?.state ?? "DRAFT";

  const { data: rateBooksData, isLoading: isLoadingRateBooks } = useQuery({
    queryKey: ["rate-books", activeProjectId],
    queryFn: () =>
      api.fetch<{ books: RateBook[] }>(`/api/projects/${activeProjectId}/rates/books`),
    enabled: Boolean(activeProjectId && isAuthenticated),
  });

  const rateBookItems = useMemo(() => {
    const items: (RateBookItem & { bookName: string })[] = [];
    for (const book of rateBooksData?.books ?? []) {
      for (const item of book.items) {
        items.push({ ...item, bookName: book.name });
      }
    }
    return items;
  }, [rateBooksData]);

  const { data: diffData, isLoading: isLoadingDiff } = useQuery({
    queryKey: ["boq-diff", activeProjectId, diffVersionA, diffVersionB],
    queryFn: () =>
      api.fetch<{ diff: BoqDiff }>(
        `/api/projects/${activeProjectId}/boq/versions/${diffVersionA}/diff/${diffVersionB}`,
      ),
    enabled: Boolean(activeProjectId && isAuthenticated && diffVersionA && diffVersionB && diffOpen),
  });

  const initialLines = useMemo(() => {
    return (latest?.lines ?? []).map((l) => ({ ...l, editable: true }));
  }, [latest]);

  const syncKey = latest?.id ?? "empty";
  const { state: lines, set: setLines, undo, redo, canUndo, canRedo, reset } = useUndoRedo(
    initialLines,
    50,
    syncKey,
  );

  const autoGenRef = useRef<string | null>(null);

  const createVersion = useMutation({
    mutationFn: () =>
      api.fetch(`/api/projects/${activeProjectId}/boq/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boq-versions", activeProjectId] });
      void queryClient.invalidateQueries({ queryKey: ["approvals", activeProjectId] });
      showToast("BOQ generated from measurements", "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  const submitApproval = useMutation({
    mutationFn: (versionId: string) =>
      api.fetch(`/api/projects/${activeProjectId}/approvals/BoqVersion/${versionId}`, {
        method: "PATCH",
        body: JSON.stringify({ state: "SUBMITTED" }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals", activeProjectId] });
      showToast("BOQ submitted for approval", "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  const applyBookRate = useMutation({
    mutationFn: (payload: { boqLineId: string; rateBookItemId: string }) =>
      api.fetch<{ line: BoqLineRow }>(`/api/projects/${activeProjectId}/rates/apply-book-rate`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      setLines((prev) =>
        prev.map((l) => (l.id === res.line.id ? { ...res.line, editable: true } : l)),
      );
      void queryClient.invalidateQueries({ queryKey: ["boq-versions", activeProjectId] });
      showToast("Rate book rate applied", "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  const handleRegenerate = useCallback(() => {
    if (!window.confirm(REGENERATE_CONFIRM_MSG)) return;
    createVersion.mutate();
  }, [createVersion]);

  const saveLines = useCallback(
    async (linesToSave = lines) => {
      if (!activeProjectId || !latest) {
        showToast("Generate a BOQ version first", "error");
        return false;
      }
      if (linesToSave.length === 0) {
        showToast("Add at least one line item", "error");
        return false;
      }
      setIsSaving(true);
      try {
        const res = await api.fetch<{ version: { lines: BoqLineRow[] } }>(
          `/api/projects/${activeProjectId}/boq/versions/${latest.id}/lines`,
          {
            method: "PUT",
            body: JSON.stringify({
              lines: linesToSave.map((l) => ({
                id: l.id,
                itemNo: l.itemNo,
                description: l.description,
                unit: l.unit,
                quantity: l.quantity,
                rate: l.rate,
                amount: l.amount,
              })),
            }),
          },
        );
        reset(res.version.lines.map((l) => ({ ...l, editable: true })));
        void queryClient.invalidateQueries({ queryKey: ["boq-versions", activeProjectId] });
        showToast("BOQ changes saved", "success");
        return true;
      } catch (err) {
        showToast(String(err), "error");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [activeProjectId, latest, lines, reset, queryClient],
  );

  useEffect(() => {
    if (!activeProjectId || isLoading || createVersion.isPending) return;
    if (boqData && boqData.versions.length === 0 && autoGenRef.current !== activeProjectId) {
      autoGenRef.current = activeProjectId;
      createVersion.mutate();
    }
  }, [activeProjectId, isLoading, boqData?.versions.length, createVersion.isPending]);

  useEffect(() => {
    if (versions.length >= 2 && !diffVersionA && !diffVersionB) {
      setDiffVersionA(versions[1].id);
      setDiffVersionB(versions[0].id);
    }
  }, [versions, diffVersionA, diffVersionB]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.amount, 0), [lines]);
  const contingency = subtotal * 0.05;
  const tax = subtotal * 0.15;
  const grandTotal = subtotal + contingency + tax;

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
        }),
      );
    },
    [setLines],
  );

  const addLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
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
    [setLines],
  );

  const handleApplyBookRate = useCallback(() => {
    if (!selectedBoqLineId || !selectedRateBookItemId) {
      showToast("Select a BOQ line and a rate book item", "error");
      return;
    }
    applyBookRate.mutate({ boqLineId: selectedBoqLineId, rateBookItemId: selectedRateBookItemId });
  }, [selectedBoqLineId, selectedRateBookItemId, applyBookRate]);

  useKeyboardShortcuts(
    {
      "ctrl+z": undo,
      "ctrl+shift+z": redo,
      "ctrl+s": (e) => {
        e.preventDefault();
        void saveLines();
      },
    },
    [undo, redo, saveLines],
  );

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
        width: 100,
        align: "center",
        render: (row) => (
          <UnitCombobox
            value={(MEASUREMENT_UNITS as readonly string[]).includes(row.unit) ? (row.unit as MeasurementUnit) : "m³"}
            units={MEASUREMENT_UNITS}
            labels={MEASUREMENT_UNIT_LABELS}
            filterUnits={filterUnits}
            onChange={(u) => updateLine(row.id, { unit: u })}
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
          <span className="font-mono text-mono text-text-primary font-semibold">{formatInr(row.amount)}</span>
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
    [updateLine, deleteLine],
  );

  const diff = diffData?.diff;
  const canSubmitApproval = latest && approvalState === "DRAFT";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-text-primary">Bill of Quantities</h1>
          <p className="font-body text-body text-text-secondary mt-1">
            Detailed line-item breakdown for cost estimation and material procurement
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={() => void saveLines()}
            disabled={!activeProjectId || !latest || isSaving}
            className="h-8 px-3 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
          <button
            onClick={handleRegenerate}
            disabled={!activeProjectId || createVersion.isPending}
            className="h-8 px-3 rounded-lg border border-border-default text-text-primary font-table text-table hover:bg-bg-hover transition-colors disabled:opacity-50"
          >
            {createVersion.isPending ? "Generating…" : "Regenerate from measurements"}
          </button>
          {canSubmitApproval && (
            <button
              onClick={() => submitApproval.mutate(latest.id)}
              disabled={submitApproval.isPending}
              className="h-8 px-3 rounded-lg border border-status-warning text-status-warning font-table text-table hover:bg-status-warning/10 transition-colors disabled:opacity-50"
            >
              {submitApproval.isPending ? "Submitting…" : "Submit for approval"}
            </button>
          )}
          <button
            onClick={addLine}
            className="h-8 px-3 rounded-lg border border-border-default text-text-primary font-table text-table hover:bg-bg-hover transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Item
          </button>
          {latest && (
            <button
              type="button"
              className="h-8 px-3 rounded-lg border border-border-default text-text-primary font-table text-table hover:bg-bg-hover transition-colors flex items-center gap-2"
              onClick={async () => {
                if (!activeProjectId || !latest) return;
                try {
                  const blob = await api.fetchBlob(
                    `/api/projects/${activeProjectId}/reports/boq/${latest.id}/pdf`,
                  );
                  window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
                } catch {
                  showToast("Export failed", "error");
                }
              }}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export PDF
            </button>
          )}
          <button
            onClick={() => navigate(projectPathOrLegacy(activeProjectId, "rates"))}
            className="h-8 px-3 rounded-lg border border-border-default text-text-primary font-table text-table hover:bg-bg-hover transition-colors"
          >
            Rate Analysis →
          </button>
        </div>
      </div>

      {!activeProjectId && (
        <div className="bg-status-warning/10 border border-status-warning rounded-lg px-4 py-3 font-table text-table">
          Select a project to view BOQ.{" "}
          <button onClick={() => navigate("/projects")} className="text-accent-primary hover:underline">
            Go to Projects
          </button>
        </div>
      )}

      {isLoading && <p className="text-text-secondary">Loading BOQ versions...</p>}
      {isError && (
        <div className="bg-error-container text-on-error-container p-4 rounded-lg">
          Failed to load BOQ versions. {(error as Error)?.message}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-2 py-1 rounded-full bg-bg-elevated border border-border-default font-mono text-mono text-text-muted">
          {latest ? `v${latest.version}${latest.label ? ` — ${latest.label}` : ""}` : "Draft (unsaved)"}
        </span>
        <span
          className={`px-2 py-1 rounded-full border font-label text-label ${APPROVAL_STYLES[approvalState]}`}
        >
          {APPROVAL_LABELS[approvalState]}
        </span>
      </div>

      {versions.length >= 2 && (
        <div className="border border-border-default rounded-lg bg-bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => setDiffOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 font-table text-table text-text-primary hover:bg-bg-hover transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">compare_arrows</span>
              Compare BOQ versions
            </span>
            <span className="material-symbols-outlined text-[20px] text-text-muted">
              {diffOpen ? "expand_less" : "expand_more"}
            </span>
          </button>
          {diffOpen && (
            <div className="border-t border-border-default px-4 py-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 font-table text-table text-text-secondary">
                  From
                  <select
                    value={diffVersionA}
                    onChange={(e) => setDiffVersionA(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-border-default bg-bg-primary text-text-primary"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version}
                        {v.label ? ` — ${v.label}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 font-table text-table text-text-secondary">
                  To
                  <select
                    value={diffVersionB}
                    onChange={(e) => setDiffVersionB(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-border-default bg-bg-primary text-text-primary"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version}
                        {v.label ? ` — ${v.label}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {diffVersionA === diffVersionB ? (
                <p className="text-text-secondary font-table text-table">Select two different versions to compare.</p>
              ) : isLoadingDiff ? (
                <p className="text-text-secondary font-table text-table">Loading diff…</p>
              ) : diff ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-status-success/30 bg-status-success/5 p-3">
                    <h3 className="font-label text-label text-status-success mb-2">
                      Added ({diff.added.length})
                    </h3>
                    {diff.added.length === 0 ? (
                      <p className="font-table text-table text-text-muted text-sm">None</p>
                    ) : (
                      <ul className="font-mono text-mono text-sm text-text-primary space-y-1">
                        {diff.added.map((no) => (
                          <li key={no}>{no}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-lg border border-accent-danger/30 bg-accent-danger/5 p-3">
                    <h3 className="font-label text-label text-accent-danger mb-2">
                      Removed ({diff.removed.length})
                    </h3>
                    {diff.removed.length === 0 ? (
                      <p className="font-table text-table text-text-muted text-sm">None</p>
                    ) : (
                      <ul className="font-mono text-mono text-sm text-text-primary space-y-1">
                        {diff.removed.map((no) => (
                          <li key={no}>{no}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-lg border border-status-warning/30 bg-status-warning/5 p-3 sm:col-span-1">
                    <h3 className="font-label text-label text-status-warning mb-2">
                      Changed ({diff.changed.length})
                    </h3>
                    {diff.changed.length === 0 ? (
                      <p className="font-table text-table text-text-muted text-sm">None</p>
                    ) : (
                      <ul className="font-table text-table text-sm text-text-primary space-y-1 max-h-40 overflow-auto">
                        {diff.changed.map((c, i) => (
                          <li key={`${c.itemNo}-${c.field}-${i}`}>
                            <span className="font-mono text-mono">{c.itemNo}</span> · {c.field}:{" "}
                            <span className="text-text-muted">{c.from}</span> → {c.to}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 p-4 border border-border-default rounded-lg bg-bg-surface">
        <label className="flex flex-col gap-1 font-table text-table text-text-secondary min-w-[200px]">
          BOQ line
          <select
            value={selectedBoqLineId}
            onChange={(e) => setSelectedBoqLineId(e.target.value)}
            className="h-8 px-2 rounded-lg border border-border-default bg-bg-primary text-text-primary"
          >
            <option value="">Select line…</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.itemNo} — {l.description}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-table text-table text-text-secondary min-w-[280px] flex-1">
          Rate book item
          <select
            value={selectedRateBookItemId}
            onChange={(e) => setSelectedRateBookItemId(e.target.value)}
            disabled={isLoadingRateBooks}
            className="h-8 px-2 rounded-lg border border-border-default bg-bg-primary text-text-primary disabled:opacity-50"
          >
            <option value="">
              {isLoadingRateBooks ? "Loading rate books…" : "Select rate book item…"}
            </option>
            {rateBookItems.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.bookName}] {item.code} — {item.description} ({formatInr(item.rate)}/{item.unit})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleApplyBookRate}
          disabled={!selectedBoqLineId || !selectedRateBookItemId || applyBookRate.isPending}
          className="h-8 px-3 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors disabled:opacity-50"
        >
          {applyBookRate.isPending ? "Applying…" : "Apply to line"}
        </button>
      </div>

      <VirtualDataTable
        columns={columns}
        data={lines}
        keyExtractor={(row) => row.id}
        emptyMessage="No BOQ items. Save measurements and generate from Measurement Book."
        maxHeight={560}
      />

      <div className="flex justify-end">
        <div className="w-full sm:w-[400px] bg-bg-surface border border-border-default rounded-lg p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-table text-table text-text-secondary">Subtotal</span>
            <span className="font-mono text-mono text-text-primary">{formatInr(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-table text-table text-text-secondary">Contingency (5%)</span>
            <span className="font-mono text-mono text-text-primary">{formatInr(contingency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-table text-table text-text-secondary">Tax / GST (15%)</span>
            <span className="font-mono text-mono text-text-primary">{formatInr(tax)}</span>
          </div>
          <div className="border-t border-border-default pt-2 mt-1 flex justify-between items-center">
            <span className="font-h3 text-h3 text-text-primary">Grand Total</span>
            <span className="font-display text-display text-accent-primary">{formatInr(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
