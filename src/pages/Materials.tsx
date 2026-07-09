import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { useActiveProjectId } from "@/features/project/useActiveProjectId";
import { showToast } from "@/components/ToastProvider";
import { UnitCombobox } from "@/components/UnitCombobox";
import { formatInr } from "@/lib/formatCurrency";
import {
  MEASUREMENT_UNITS,
  MEASUREMENT_UNIT_LABELS,
  filterUnits,
  type MeasurementUnit,
} from "@/domain/schemas";

interface MaterialRow {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  spec: string | null;
  latestRate: number | null;
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

export default function Materials() {
  const projectId = useActiveProjectId();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["materials", projectId],
    queryFn: () => api.fetch<{ materials: MaterialRow[] }>(`/api/projects/${projectId}/materials`),
    enabled: Boolean(projectId && isAuthenticated),
  });

  const materials = data?.materials ?? [];

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
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Material Library</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Search, compare, and manage structural materials for your estimate.
            </p>
          </div>
          {projectId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
                setShowForm((v) => !v);
              }}
              className="h-touch-target-min px-gutter bg-secondary text-on-secondary rounded-xl flex items-center justify-center gap-2 font-table-data text-table-data font-bold hover:bg-primary transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
            >
              <span className="material-symbols-outlined">add</span>
              Add Material
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-stack-sm w-full mt-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, category, spec, or unit"
              className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
          </div>
        </div>
      </section>

      {!projectId && (
        <div className="mt-stack-md border border-outline-variant rounded-xl p-gutter text-on-surface-variant font-body-md">
          Select a project to manage materials.
        </div>
      )}

      {isError && (
        <div className="mt-stack-md bg-error-container text-on-error-container p-4 rounded-xl">
          Failed to load materials. {(error as Error)?.message}
        </div>
      )}

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
                placeholder="Optional"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <span className="font-label-caps text-label-caps text-outline">Specification</span>
              <input
                value={form.spec}
                onChange={(e) => setForm((f) => ({ ...f, spec: e.target.value }))}
                className="h-touch-target-min px-3 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface"
                placeholder="e.g. IS 269:2015, 50 kg bag"
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
              {saveMaterial.isPending ? "Saving…" : editingId ? "Update" : "Save"}
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

      <section className="mt-stack-md">
        {isLoading && (
          <p className="font-body-md text-body-md text-on-surface-variant">Loading materials…</p>
        )}

        {!isLoading && filtered.length === 0 && projectId && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter text-center text-on-surface-variant font-body-md">
            {search ? "No materials match your search." : "No materials yet. Add one to get started."}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter flex flex-col gap-stack-md hover:border-outline transition-all group shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-surface-variant to-surface-tint border border-outline-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant">texture</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                      {m.name}
                    </h3>
                    <p className="font-table-data text-table-data text-outline mt-0.5">{m.code}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                        {m.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-l-4 border-primary pl-base py-1">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps text-outline mb-1">Base Rate</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                        {m.latestRate != null ? formatInr(m.latestRate) : "—"}
                      </span>
                      <span className="font-table-data text-table-data text-outline">/ {m.unit}</span>
                    </div>
                  </div>
                </div>
                {m.spec && (
                  <p className="font-table-data text-table-data text-on-surface-variant line-clamp-2">{m.spec}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-stack-sm border-t border-outline-variant mt-auto">
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  className="h-10 px-4 bg-surface-container border border-outline-variant text-primary rounded-lg font-table-data text-table-data hover:bg-surface-variant transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${m.name}"?`)) deleteMaterial.mutate(m.id);
                  }}
                  className="h-10 px-4 border border-outline-variant text-error rounded-lg font-table-data text-table-data hover:bg-error-container/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
