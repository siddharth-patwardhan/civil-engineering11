import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { useActiveProjectId } from "@/features/project/useActiveProjectId";
import { showToast } from "@/components/ToastProvider";
import { UnitCombobox } from "@/components/UnitCombobox";
import { formatInr } from "@/lib/formatCurrency";
import { calculateRelativeMaterialCost } from "@/domain/materialCostEngine";
import {
  MEASUREMENT_UNITS,
  MEASUREMENT_UNIT_LABELS,
  filterUnits,
  type MeasurementUnit,
} from "@/domain/schemas";

interface RateHistoryItem {
  id: string;
  rate: number;
  supplierName: string | null;
  effectiveFrom: string;
}

interface MaterialRow {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  spec: string | null;
  latestRate: number | null;
  baseRate: number | null;
  relativeCost?: {
    baseRate: number;
    adjustedBaseRate: number;
    currentRate: number;
    effectiveRate: number;
    diffAmount: number;
    diffPercent: number;
    status: "increased" | "decreased" | "unchanged";
  };
  rateHistory?: RateHistoryItem[];
}

const EMPTY_FORM = {
  code: "",
  name: "",
  category: "",
  unit: "kg" as MeasurementUnit,
  spec: "",
  rate: "" as number | "",
};

const CATEGORY_OPTIONS = [
  "Concrete & Masonry",
  "Metals & Steel",
  "Aggregates",
  "Timber & Formwork",
  "Finishes",
  "Plumbing",
  "Electrical",
  "Miscellaneous",
];

const SAMPLE_PDF_PRESET = `CPWD DSR Schedule 2023 / Government Rules Specification
CPWD-DSR-3.1 Ordinary Portland Cement (OPC 53) bag 380.00 IS 269:2015
CPWD-DSR-5.22 TMT Steel Fe-500D Reinforcement Bars kg 68.00 IS 1786:2008
CPWD-DSR-3.5 Coarse Aggregate 20mm Nominal Size m³ 1150.00 IS 383:2016
CPWD-DSR-3.8 Fine Aggregate River Sand (Zone II) m³ 1650.00 IS 383:2016
CPWD-DSR-6.1 First Class Burnt Clay Bricks 1000 nos 7500.00 IS 1077:1992
CPWD-DSR-4.1.3 Ready Mix Concrete M25 Grade m³ 4100.00 IS 456:2000`;

export default function Materials() {
  const projectId = useActiveProjectId();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"catalog" | "tool" | "importer" | "batch">("catalog");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  // Selector Tool State
  const [selectedMatId, setSelectedMatId] = useState<string>("");
  const [toolCustomRate, setToolCustomRate] = useState<number>(0);
  const [toolMultiplier, setToolMultiplier] = useState<number>(1.0);
  const [toolQuantity, setToolQuantity] = useState<number>(100);
  const [toolSupplier, setToolSupplier] = useState<string>("Latest Market Supplier");

  // Importer State
  const [pdfText, setPdfText] = useState<string>(SAMPLE_PDF_PRESET);

  // Batch Escalation State
  const [batchCategory, setBatchCategory] = useState<string>("");
  const [batchPercent, setBatchPercent] = useState<number>(5.0);
  const [batchSupplier, setBatchSupplier] = useState<string>("Q3 2026 Market Index Adjustment");

  // Fetch materials list
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["materials", projectId],
    queryFn: () => api.fetch<{ materials: MaterialRow[] }>(`/api/projects/${projectId}/materials`),
    enabled: Boolean(projectId && isAuthenticated),
  });

  const materials = data?.materials ?? [];

  // Currently selected material in Selector Tool
  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.id === selectedMatId) ?? materials[0] ?? null;
  }, [materials, selectedMatId]);

  // Set default selection when materials load
  useMemo(() => {
    if (!selectedMatId && materials.length > 0) {
      setSelectedMatId(materials[0].id);
      setToolCustomRate(materials[0].latestRate ?? materials[0].baseRate ?? 0);
    }
  }, [materials, selectedMatId]);

  // Calculated relative costing for selected material in tool
  const toolComparison = useMemo(() => {
    if (!selectedMaterial) return null;
    const base = selectedMaterial.baseRate ?? selectedMaterial.latestRate ?? 0;
    return calculateRelativeMaterialCost({
      baseRate: base,
      currentRate: toolCustomRate > 0 ? toolCustomRate : base,
      quantity: toolQuantity,
      multiplier: toolMultiplier,
    });
  }, [selectedMaterial, toolCustomRate, toolQuantity, toolMultiplier]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(
      (m) =>
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q) ||
        (m.spec ?? "").toLowerCase().includes(q),
    );
  }, [materials, search]);

  // Save single material
  const saveMaterial = useMutation({
    mutationFn: async () => {
      const body = {
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        unit: form.unit,
        spec: form.spec.trim() || undefined,
        ...(form.rate !== "" ? { rate: Number(form.rate) } : {}),
      };
      if (editingId) {
        return api.fetch(`/api/projects/${projectId}/materials/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      return api.fetch(`/api/projects/${projectId}/materials`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["materials", projectId] });
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      showToast(editingId ? "Material updated" : "Material added", "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  // Save rate revision from Selector Tool
  const saveRateRevision = useMutation({
    mutationFn: async () => {
      if (!selectedMaterial) return;
      return api.fetch(`/api/projects/${projectId}/materials/${selectedMaterial.id}`, {
        method: "PUT",
        body: JSON.stringify({
          code: selectedMaterial.code,
          name: selectedMaterial.name,
          category: selectedMaterial.category,
          unit: selectedMaterial.unit,
          spec: selectedMaterial.spec ?? undefined,
          rate: Number((toolCustomRate * toolMultiplier).toFixed(2)),
          supplierName: toolSupplier || "Custom Cost Revision",
        }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["materials", projectId] });
      showToast(`Updated rate for ${selectedMaterial?.name}`, "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  // Import Official Government DSR Bundle
  const importGovernmentBundle = useMutation({
    mutationFn: () =>
      api.fetch<{ message: string }>(`/api/projects/${projectId}/materials/import-government`, {
        method: "POST",
      }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["materials", projectId] });
      showToast(res.message || "Government DSR schedule imported successfully!", "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  // Import PDF Schedule Text
  const importPdfSchedule = useMutation({
    mutationFn: () =>
      api.fetch<{ message: string; importedCount: number }>(`/api/projects/${projectId}/materials/import-pdf`, {
        method: "POST",
        body: JSON.stringify({ rawText: pdfText }),
      }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["materials", projectId] });
      showToast(res.message || `Imported ${res.importedCount} items from PDF text.`, "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  // Batch Rate Multiplier Adjustment
  const batchRateAdjustment = useMutation({
    mutationFn: () =>
      api.fetch<{ message: string }>(`/api/projects/${projectId}/materials/batch-rate-update`, {
        method: "POST",
        body: JSON.stringify({
          category: batchCategory || undefined,
          percentChange: batchPercent,
          supplierName: batchSupplier,
        }),
      }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["materials", projectId] });
      showToast(res.message || "Batch rate adjustment applied.", "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  // Apply latest material rates to BOQ lines
  const applyRatesToBoq = useMutation({
    mutationFn: () =>
      api.fetch<{ message: string }>(`/api/projects/${projectId}/materials/apply-to-boq`, {
        method: "POST",
      }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["boq-versions", projectId] });
      showToast(res.message || "Applied latest material rates to BOQ.", "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  const deleteMaterial = useMutation({
    mutationFn: (id: string) =>
      api.fetch(`/api/projects/${projectId}/materials/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["materials", projectId] });
      showToast("Material removed", "info");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  const startEdit = (m: MaterialRow) => {
    setEditingId(m.id);
    setForm({
      code: m.code,
      name: m.name,
      category: m.category,
      unit: (MEASUREMENT_UNITS as readonly string[]).includes(m.unit)
        ? (m.unit as MeasurementUnit)
        : "kg",
      spec: m.spec ?? "",
      rate: m.latestRate ?? "",
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  return (
    <>
      <section className="flex flex-col gap-stack-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-stack-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Material Library & Relative Costing</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Select materials, track volatile market costs relative to government standards (DSR), and import rule schedules from PDF.
            </p>
          </div>
          {projectId && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => importGovernmentBundle.mutate()}
                disabled={importGovernmentBundle.isPending}
                className="h-touch-target-min px-4 bg-surface-container border border-outline text-primary rounded-xl flex items-center gap-2 font-table-data text-table-data hover:bg-surface-variant transition-colors shadow-sm disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
                {importGovernmentBundle.isPending ? "Importing…" : "Import Govt DSR Schedule"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                  setShowForm((v) => !v);
                }}
                className="h-touch-target-min px-4 bg-secondary text-on-secondary rounded-xl flex items-center gap-2 font-table-data text-table-data font-bold hover:bg-primary transition-colors shadow-sm whitespace-nowrap"
              >
                <span className="material-symbols-outlined">add</span>
                Add Custom Material
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant mt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-3 font-table-data text-table-data font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "catalog"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            Material Catalog ({materials.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tool")}
            className={`px-4 py-3 font-table-data text-table-data font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "tool"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
            Material & Cost Customizer Tool
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("importer")}
            className={`px-4 py-3 font-table-data text-table-data font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "importer"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            Government Rule & PDF Importer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("batch")}
            className={`px-4 py-3 font-table-data text-table-data font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "batch"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">trending_up</span>
            Batch Escalation & BOQ Sync
          </button>
        </div>
      </section>

      {!projectId && (
        <div className="mt-stack-md border border-outline-variant rounded-xl p-gutter text-on-surface-variant font-body-md">
          Select a project to manage materials and relative costing.
        </div>
      )}

      {isError && (
        <div className="mt-stack-md bg-error-container text-on-error-container p-4 rounded-xl">
          Failed to load materials. {(error as Error)?.message}
        </div>
      )}

      {/* New Material Form Modal / Inline Box */}
      {showForm && projectId && (
        <section className="mt-stack-md bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter shadow-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md">
            {editingId ? "Edit Material" : "New Material"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-md">
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Code</span>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
                placeholder="e.g. CEM-OPC-53"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-label-caps text-label-caps text-outline">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
                placeholder="e.g. OPC 53 Grade Cement"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Unit</span>
              <div className="h-touch-target-min px-2 bg-surface border border-outline-variant rounded-lg flex items-center">
                <UnitCombobox
                  value={form.unit}
                  units={MEASUREMENT_UNITS}
                  labels={MEASUREMENT_UNIT_LABELS}
                  filterUnits={filterUnits}
                  onChange={(u) => setForm((f) => ({ ...f, unit: u }))}
                />
              </div>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Rate (₹)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.rate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rate: e.target.value === "" ? "" : Number(e.target.value) }))
                }
                className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
                placeholder="Market Rate"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <span className="font-label-caps text-label-caps text-outline">Specification & Rule Citation</span>
              <input
                value={form.spec}
                onChange={(e) => setForm((f) => ({ ...f, spec: e.target.value }))}
                className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
                placeholder="e.g. Conforming to IS 269:2015, CPWD DSR 2023 Item 3.1"
              />
            </label>
          </div>
          <div className="flex gap-2 mt-stack-md">
            <button
              type="button"
              disabled={
                !form.code.trim() ||
                !form.name.trim() ||
                !form.category.trim() ||
                saveMaterial.isPending
              }
              onClick={() => saveMaterial.mutate()}
              className="h-touch-target-min px-6 bg-secondary text-on-secondary rounded-lg font-table-data text-table-data font-bold hover:bg-primary transition-colors disabled:opacity-50"
            >
              {saveMaterial.isPending ? "Saving…" : editingId ? "Update" : "Save Material"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="h-touch-target-min px-4 border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* TAB 1: CATALOG & RELATIVE COST CARDS */}
      {activeTab === "catalog" && projectId && (
        <section className="mt-stack-md flex flex-col gap-stack-md">
          <div className="flex flex-col sm:flex-row gap-stack-sm w-full">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by material code, description, specification, IS rule citation, or category"
                className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
              />
            </div>
          </div>

          {isLoading && <p className="font-body-md text-on-surface-variant">Loading materials library…</p>}

          {!isLoading && filtered.length === 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter text-center text-on-surface-variant font-body-md">
              {search
                ? "No materials match your search."
                : "No materials in library yet. Click 'Import Govt DSR Schedule' or 'Add Custom Material'."}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {filtered.map((m) => {
              const rel = m.relativeCost;
              const isInc = rel && rel.status === "increased";
              const isDec = rel && rel.status === "decreased";

              return (
                <article
                  key={m.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter flex flex-col gap-stack-md hover:border-outline transition-all group shadow-sm relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-surface-variant to-surface-tint border border-outline-variant flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant">texture</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                          {m.name}
                        </h3>
                        <p className="font-table-data text-table-data text-outline mt-0.5">{m.code}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                      {m.category}
                    </span>
                    {rel && (
                      <span
                        className={`font-label-caps text-label-caps px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                          isInc
                            ? "bg-error-container/30 text-error"
                            : isDec
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isInc ? "trending_up" : isDec ? "trending_down" : "drag_handle"}
                        </span>
                        {rel.diffPercent > 0 ? `+${rel.diffPercent}%` : `${rel.diffPercent}%`} vs DSR Base
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 border-l-4 border-primary pl-base py-1 bg-surface-container-low/50 rounded-r-lg">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="font-label-caps text-label-caps text-outline block mb-0.5">Latest Costing</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                            {m.latestRate != null ? formatInr(m.latestRate) : "—"}
                          </span>
                          <span className="font-table-data text-table-data text-outline">/ {m.unit}</span>
                        </div>
                      </div>

                      {m.baseRate != null && m.baseRate !== m.latestRate && (
                        <div className="text-right">
                          <span className="font-label-caps text-label-caps text-outline block mb-0.5">DSR Base</span>
                          <span className="font-table-data text-table-data text-outline line-through">
                            {formatInr(m.baseRate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {m.spec && (
                      <p className="font-table-data text-table-data text-on-surface-variant line-clamp-2 mt-1 border-t border-outline-variant/40 pt-1">
                        {m.spec}
                      </p>
                    )}
                  </div>

                  {m.rateHistory && m.rateHistory.length > 1 && (
                    <div className="text-xs text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">history</span>
                      {m.rateHistory.length} rate revisions logged
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-stack-sm border-t border-outline-variant mt-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMatId(m.id);
                        setToolCustomRate(m.latestRate ?? m.baseRate ?? 0);
                        setActiveTab("tool");
                      }}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">tune</span> Customize Cost
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="h-8 px-3 bg-surface-container border border-outline-variant text-primary rounded-lg font-table-data text-table-data hover:bg-surface-variant transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${m.name}"?`)) deleteMaterial.mutate(m.id);
                        }}
                        className="h-8 px-3 border border-outline-variant text-error rounded-lg font-table-data text-table-data hover:bg-error-container/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: DIRECT MATERIAL SELECTOR & COST CUSTOMIZER TOOL */}
      {activeTab === "tool" && projectId && (
        <section className="mt-stack-md bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter shadow-sm flex flex-col gap-stack-md">
          <div className="border-b border-outline-variant pb-stack-sm">
            <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              Direct Material & Cost Customizer Tool
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Directly select materials, view base government DSR costing, adjust for volatile market prices or site location multipliers, and view relative cost impact.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg">
            {/* Left Column: Direct Selector & Controls */}
            <div className="flex flex-col gap-stack-md">
              <label className="flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-outline font-bold">1. Select Material</span>
                <select
                  value={selectedMatId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedMatId(id);
                    const mat = materials.find((m) => m.id === id);
                    if (mat) setToolCustomRate(mat.latestRate ?? mat.baseRate ?? 0);
                  }}
                  className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-xl font-table-data text-table-data text-on-surface font-bold text-base"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.name} — ({m.category}) @ {formatInr(m.latestRate ?? m.baseRate ?? 0)}/{m.unit}
                    </option>
                  ))}
                </select>
              </label>

              {selectedMaterial && (
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-label-caps text-label-caps text-primary font-bold">{selectedMaterial.code}</span>
                      <h4 className="font-headline-md text-headline-md text-on-surface">{selectedMaterial.name}</h4>
                    </div>
                    <span className="px-2 py-1 bg-surface border border-outline-variant rounded font-table-data text-xs">
                      {selectedMaterial.unit}
                    </span>
                  </div>
                  {selectedMaterial.spec && (
                    <p className="text-sm text-on-surface-variant font-table-data border-t border-outline-variant/40 pt-2 mt-1">
                      {selectedMaterial.spec}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
                <label className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-outline font-bold">2. Customizable Market Cost (₹)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={toolCustomRate}
                    onChange={(e) => setToolCustomRate(Number(e.target.value))}
                    className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data font-bold text-lg text-primary"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-outline font-bold">3. Location / Escalation Index</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.5}
                      max={3.0}
                      step={0.01}
                      value={toolMultiplier}
                      onChange={(e) => setToolMultiplier(Number(e.target.value))}
                      className="h-touch-target-min px-3 w-28 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data font-bold text-lg text-on-surface"
                    />
                    <span className="text-xs text-on-surface-variant font-table-data">
                      ({toolMultiplier > 1 ? `+${((toolMultiplier - 1) * 100).toFixed(1)}%` : `${((toolMultiplier - 1) * 100).toFixed(1)}%`})
                    </span>
                  </div>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-outline">Supplier / Costing Source</span>
                  <input
                    type="text"
                    value={toolSupplier}
                    onChange={(e) => setToolSupplier(e.target.value)}
                    className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
                    placeholder="e.g. Local Vendor Quote Q3"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-outline">Project Quantity Estimate</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={toolQuantity}
                      onChange={(e) => setToolQuantity(Number(e.target.value))}
                      className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
                    />
                    <span className="text-xs text-outline">{selectedMaterial?.unit}</span>
                  </div>
                </label>
              </div>

              <button
                type="button"
                disabled={!selectedMaterial || saveRateRevision.isPending}
                onClick={() => saveRateRevision.mutate()}
                className="h-touch-target-min px-6 bg-primary text-on-primary rounded-xl font-table-data text-table-data font-bold hover:bg-secondary transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {saveRateRevision.isPending ? "Saving Rate Revision…" : "Save Rate Revision to Material Library"}
              </button>
            </div>

            {/* Right Column: Live Relative Costing Card */}
            {toolComparison && selectedMaterial && (
              <div className="bg-surface border border-outline-variant rounded-2xl p-gutter flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
                    <span className="font-label-caps text-label-caps text-outline font-bold">Relative Costing Analysis</span>
                    <span
                      className={`px-3 py-1 rounded-full font-table-data text-xs font-bold flex items-center gap-1 ${
                        toolComparison.status === "increased"
                          ? "bg-error-container/30 text-error"
                          : toolComparison.status === "decreased"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {toolComparison.status === "increased" ? "trending_up" : toolComparison.status === "decreased" ? "trending_down" : "drag_handle"}
                      </span>
                      {toolComparison.diffPercent > 0 ? `+${toolComparison.diffPercent}%` : `${toolComparison.diffPercent}%`}{" "}
                      {toolComparison.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-surface-container-low rounded-xl">
                      <span className="text-xs text-outline block mb-1">DSR Base Rate</span>
                      <span className="font-display-metrics text-2xl text-on-surface font-bold">
                        {formatInr(toolComparison.baseRate)}
                      </span>
                      <span className="text-xs text-outline block mt-0.5">/ {selectedMaterial.unit}</span>
                    </div>

                    <div className="p-3 bg-primary-container/20 border border-primary/30 rounded-xl">
                      <span className="text-xs text-primary font-bold block mb-1">Effective Customizable Rate</span>
                      <span className="font-display-metrics text-2xl text-primary font-bold">
                        {formatInr(toolComparison.effectiveRate)}
                      </span>
                      <span className="text-xs text-outline block mt-0.5">/ {selectedMaterial.unit}</span>
                    </div>
                  </div>

                  <div className="border-t border-b border-outline-variant py-3 my-2 flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Rate Delta Variance per Unit:</span>
                      <span className={`font-bold font-mono ${toolComparison.diffAmount > 0 ? "text-error" : "text-emerald-700"}`}>
                        {toolComparison.diffAmount > 0 ? `+${formatInr(toolComparison.diffAmount)}` : formatInr(toolComparison.diffAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Total Cost for {toolQuantity} {selectedMaterial.unit} @ Base:</span>
                      <span className="font-mono text-on-surface">{formatInr(toolComparison.totalCostAtBase)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Total Cost for {toolQuantity} {selectedMaterial.unit} @ Latest:</span>
                      <span className="font-mono font-bold text-primary">{formatInr(toolComparison.totalCostAtCurrent)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container p-3 rounded-xl flex justify-between items-center mt-4">
                  <div>
                    <span className="text-xs text-outline block">Net Cost Variance Impact</span>
                    <span className={`text-lg font-bold font-mono ${toolComparison.totalVariance > 0 ? "text-error" : "text-emerald-700"}`}>
                      {toolComparison.totalVariance > 0 ? `+${formatInr(toolComparison.totalVariance)}` : formatInr(toolComparison.totalVariance)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyRatesToBoq.mutate()}
                    disabled={applyRatesToBoq.isPending}
                    className="h-9 px-4 bg-secondary text-on-secondary rounded-lg font-table-data text-xs font-bold hover:bg-primary transition-colors disabled:opacity-50"
                  >
                    {applyRatesToBoq.isPending ? "Syncing…" : "Apply to Project BOQ"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: GOVERNMENT RULES & PDF IMPORTER */}
      {activeTab === "importer" && projectId && (
        <section className="mt-stack-md bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter shadow-sm flex flex-col gap-stack-md">
          <div className="border-b border-outline-variant pb-stack-sm flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                Government Rules & PDF Schedule Importer
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Parse government schedules of rates (CPWD DSR, State PWD) or PDF material specifications directly into your project library.
              </p>
            </div>
            <button
              type="button"
              onClick={() => importGovernmentBundle.mutate()}
              disabled={importGovernmentBundle.isPending}
              className="h-touch-target-min px-4 bg-secondary text-on-secondary rounded-xl font-table-data text-table-data font-bold hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_download</span>
              {importGovernmentBundle.isPending ? "Importing…" : "1-Click CPWD DSR Bundle Import"}
            </button>
          </div>

          <div className="flex flex-col gap-stack-sm">
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline font-bold">Paste Raw PDF Text / Government Schedule Lines</span>
              <textarea
                rows={8}
                value={pdfText}
                onChange={(e) => setPdfText(e.target.value)}
                className="w-full p-3 bg-surface border border-outline-variant rounded-xl font-mono text-sm text-on-surface focus:outline-none focus:border-primary"
                placeholder="Paste text copied from government PDF schedule..."
              />
            </label>

            <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-xl border border-outline-variant">
              <span className="text-xs text-on-surface-variant">
                Supports automated extraction of material code, item title, unit (bag, kg, m³, m²), rate (₹), and IS rule reference citations.
              </span>
              <button
                type="button"
                disabled={!pdfText.trim() || importPdfSchedule.isPending}
                onClick={() => importPdfSchedule.mutate()}
                className="h-touch-target-min px-6 bg-primary text-on-primary rounded-xl font-table-data text-table-data font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                {importPdfSchedule.isPending ? "Parsing & Importing…" : "Parse & Import Materials from Text"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: BATCH CATEGORY ESCALATION & BOQ SYNC */}
      {activeTab === "batch" && projectId && (
        <section className="mt-stack-md bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter shadow-sm flex flex-col gap-stack-md">
          <div className="border-b border-outline-variant pb-stack-sm">
            <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              Batch Category Escalation & BOQ Rate Sync
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Apply market percentage escalation factors across entire material categories (e.g. steel market inflation) and update project BOQ lines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
            {/* Batch Escalation Controls */}
            <div className="flex flex-col gap-stack-md bg-surface border border-outline-variant p-margin-mobile rounded-xl">
              <h4 className="font-headline-md text-headline-md text-on-surface">1. Apply Relative Market Escalation Index</h4>

              <label className="flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-outline">Target Category</span>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
                >
                  <option value="">All Categories ({materials.length} items)</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-outline">Relative % Price Adjustment</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={0.5}
                    value={batchPercent}
                    onChange={(e) => setBatchPercent(Number(e.target.value))}
                    className="h-touch-target-min px-3 w-32 bg-surface-container-lowest border border-outline-variant rounded-lg font-table-data text-table-data font-bold text-lg text-primary"
                  />
                  <span className="text-sm font-bold text-on-surface-variant">% Market Change</span>
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-outline">Source Note</span>
                <input
                  type="text"
                  value={batchSupplier}
                  onChange={(e) => setBatchSupplier(e.target.value)}
                  className="h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
                />
              </label>

              <button
                type="button"
                disabled={batchRateAdjustment.isPending}
                onClick={() => batchRateAdjustment.mutate()}
                className="h-touch-target-min px-6 bg-primary text-on-primary rounded-xl font-table-data text-table-data font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
                {batchRateAdjustment.isPending ? "Applying Adjustment…" : "Apply Category Market Adjustment"}
              </button>
            </div>

            {/* Sync Rates to BOQ Card */}
            <div className="flex flex-col gap-stack-md bg-surface border border-outline-variant p-margin-mobile rounded-xl justify-between">
              <div>
                <h4 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">sync</span>
                  2. Synchronize Material Costs to BOQ
                </h4>
                <p className="text-sm text-on-surface-variant mt-2">
                  Automatically match latest material market rates to corresponding item lines in active project Bill of Quantities (BOQ) and recalculate total item amounts.
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-xs text-on-surface-variant flex flex-col gap-1">
                <span className="font-bold text-on-surface">Active BOQ Sync Rules:</span>
                <span>• Material rate changes apply relative to item unit quantities.</span>
                <span>• Preserves line item numbers, section headings, and audit history.</span>
              </div>

              <button
                type="button"
                disabled={applyRatesToBoq.isPending}
                onClick={() => applyRatesToBoq.mutate()}
                className="h-touch-target-min px-6 bg-secondary text-on-secondary rounded-xl font-table-data text-table-data font-bold hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
                {applyRatesToBoq.isPending ? "Synchronizing BOQ…" : "Synchronize Latest Material Rates to BOQ"}
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
