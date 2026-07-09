import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { useActiveProjectId } from "@/features/project/useActiveProjectId";
import { showToast } from "@/components/ToastProvider";
import { formatInr, formatInrCompact } from "@/lib/formatCurrency";

interface LabourRow {
  id: string;
  name: string;
  dailyRate: number;
  unit: "day" | "hour" | "job";
  skillLevel: "skilled" | "unskilled" | "semi_skilled";
  productivityUnit: string | null;
  productivityRate: number | null;
}

const EMPTY_FORM = {
  name: "",
  dailyRate: 0,
  unit: "day" as LabourRow["unit"],
  skillLevel: "semi_skilled" as LabourRow["skillLevel"],
  productivityUnit: "",
  productivityRate: "" as number | "",
};

const SKILL_LABELS: Record<LabourRow["skillLevel"], string> = {
  skilled: "Skilled",
  semi_skilled: "Semi-skilled",
  unskilled: "Unskilled",
};

const UNIT_LABELS: Record<LabourRow["unit"], string> = {
  day: "per day",
  hour: "per hour",
  job: "per job",
};

export default function Labour() {
  const projectId = useActiveProjectId();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["labour", projectId],
    queryFn: () => api.fetch<{ labour: LabourRow[] }>(`/api/projects/${projectId}/labour`),
    enabled: Boolean(projectId && isAuthenticated),
  });

  const labour = data?.labour ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return labour;
    return labour.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.skillLevel.toLowerCase().includes(q) ||
        l.unit.toLowerCase().includes(q) ||
        (l.productivityUnit ?? "").toLowerCase().includes(q),
    );
  }, [labour, search]);

  const stats = useMemo(() => {
    const skilled = labour.filter((l) => l.skillLevel === "skilled");
    const unskilled = labour.filter((l) => l.skillLevel === "unskilled");
    const semiSkilled = labour.filter((l) => l.skillLevel === "semi_skilled");
    const dailyCost = labour.reduce((s, l) => s + (l.unit === "day" ? l.dailyRate : l.dailyRate * 8), 0);
    const avgProductivity =
      labour.filter((l) => l.productivityRate != null).length > 0
        ? Math.round(
            (labour.reduce((s, l) => s + (l.productivityRate ?? 0), 0) /
              labour.filter((l) => l.productivityRate != null).length) *
              10,
          ) / 10
        : 0;
    return {
      total: labour.length,
      skilled: skilled.length,
      unskilled: unskilled.length + semiSkilled.length,
      dailyCost,
      avgProductivity,
    };
  }, [labour]);

  const saveLabour = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        dailyRate: form.dailyRate,
        unit: form.unit,
        skillLevel: form.skillLevel,
        productivityUnit: form.productivityUnit?.trim() || undefined,
        ...(form.productivityRate !== "" ? { productivityRate: Number(form.productivityRate) } : {}),
      };
      if (editingId) {
        return api.fetch(`/api/projects/${projectId}/labour/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      return api.fetch(`/api/projects/${projectId}/labour`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labour", projectId] });
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      showToast(editingId ? "Labour category updated" : "Labour category added", "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  const deleteLabour = useMutation({
    mutationFn: (id: string) => api.fetch(`/api/projects/${projectId}/labour/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labour", projectId] });
      showToast("Labour category removed", "info");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  const startEdit = (l: LabourRow) => {
    setEditingId(l.id);
    setForm({
      name: l.name,
      dailyRate: l.dailyRate,
      unit: l.unit,
      skillLevel: l.skillLevel,
      productivityUnit: l.productivityUnit ?? "",
      productivityRate: l.productivityRate ?? "",
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const bySkill = useMemo(() => {
    const groups: Record<LabourRow["skillLevel"], LabourRow[]> = {
      skilled: [],
      semi_skilled: [],
      unskilled: [],
    };
    for (const l of filtered) groups[l.skillLevel].push(l);
    return groups;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Labour Management</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">
            Workforce categories, daily wages, and productivity rates
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
            className="flex items-center justify-center h-touch-target-min px-6 rounded-full bg-secondary text-on-secondary font-table-data whitespace-nowrap active:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
            Add Category
          </button>
        )}
      </div>

      {!projectId && (
        <div className="border border-outline-variant rounded-xl p-stack-lg text-on-surface-variant font-body-md">
          Select a project to manage labour categories.
        </div>
      )}

      {isError && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl">
          Failed to load labour data. {(error as Error)?.message}
        </div>
      )}

      <div className="relative flex-1 max-w-md">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, skill, or unit"
          className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg border-l-4 border-l-secondary flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-outline">Total Categories</span>
            <span className="material-symbols-outlined text-outline">groups</span>
          </div>
          <div>
            <div className="font-display-metrics text-display-metrics text-on-surface">
              {isLoading ? "—" : stats.total}
            </div>
            <div className="font-table-data text-table-data text-primary mt-1">
              {stats.skilled} skilled · {stats.unskilled} other
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg border-l-4 border-l-primary flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-outline">Skilled Roles</span>
            <span className="material-symbols-outlined text-outline">engineering</span>
          </div>
          <div>
            <div className="font-display-metrics text-display-metrics text-on-surface">
              {isLoading ? "—" : stats.skilled}
            </div>
            <div className="font-table-data text-table-data text-on-surface-variant mt-1">Masons, carpenters, etc.</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg border-l-4 border-l-tertiary-container flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-outline">Est. Daily Wage</span>
            <span className="material-symbols-outlined text-outline">payments</span>
          </div>
          <div>
            <div className="font-display-metrics text-display-metrics text-on-surface">
              {isLoading ? "—" : formatInrCompact(stats.dailyCost)}
            </div>
            <div className="font-table-data text-table-data text-on-surface-variant mt-1">Sum of day-rate categories</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg border-l-4 border-l-secondary-container flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-outline">Avg Productivity</span>
            <span className="material-symbols-outlined text-outline">speed</span>
          </div>
          <div>
            <div className="font-display-metrics text-display-metrics text-on-surface">
              {isLoading ? "—" : stats.avgProductivity > 0 ? stats.avgProductivity : "—"}
            </div>
            <div className="font-table-data text-table-data text-on-surface-variant mt-1">Across tracked roles</div>
          </div>
        </div>
      </div>

      {showForm && projectId && (
        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md">
            {editingId ? "Edit Labour Category" : "New Labour Category"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-md">
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-table-data text-table-data"
                placeholder="e.g. Mason (1st class)"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Rate (₹)</span>
              <input
                type="number"
                min={0}
                value={form.dailyRate}
                onChange={(e) => setForm((f) => ({ ...f, dailyRate: Number(e.target.value) }))}
                className="h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-table-data text-table-data"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Unit</span>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as LabourRow["unit"] }))}
                className="h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-table-data text-table-data"
              >
                <option value="day">Day</option>
                <option value="hour">Hour</option>
                <option value="job">Job</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Skill Level</span>
              <select
                value={form.skillLevel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, skillLevel: e.target.value as LabourRow["skillLevel"] }))
                }
                className="h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-table-data text-table-data"
              >
                <option value="skilled">Skilled</option>
                <option value="semi_skilled">Semi-skilled</option>
                <option value="unskilled">Unskilled</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Productivity Unit</span>
              <input
                value={form.productivityUnit ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, productivityUnit: e.target.value }))}
                className="h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-table-data text-table-data"
                placeholder="e.g. m³, m²"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-outline">Productivity Rate</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.productivityRate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productivityRate: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-table-data text-table-data"
                placeholder="Optional"
              />
            </label>
          </div>
          <div className="flex gap-2 mt-stack-md">
            <button
              type="button"
              disabled={!form.name.trim() || saveLabour.isPending}
              onClick={() => saveLabour.mutate()}
              className="h-touch-target-min px-6 rounded-full bg-secondary text-on-secondary font-table-data disabled:opacity-50"
            >
              {saveLabour.isPending ? "Saving…" : editingId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="h-touch-target-min px-4 rounded-full border border-outline text-on-surface font-table-data hover:bg-surface-variant transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <h3 className="font-headline-md text-headline-md text-on-surface mt-stack-md border-b border-outline-variant pb-2">
        Category Breakdown
      </h3>

      {isLoading && <p className="font-body-md text-on-surface-variant">Loading labour categories…</p>}

      {!isLoading && filtered.length === 0 && projectId && (
        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg text-center text-on-surface-variant">
          {search ? "No categories match your search." : "No labour categories yet."}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {(["skilled", "semi_skilled", "unskilled"] as const).map((level) => {
          const items = bySkill[level];
          if (items.length === 0) return null;
          const isSkilled = level === "skilled";
          return (
            <div
              key={level}
              className="bg-surface border border-outline-variant rounded-xl p-stack-lg lg:col-span-1"
            >
              <div className="flex items-center gap-stack-sm mb-stack-md">
                <div
                  className={`w-10 h-10 rounded flex items-center justify-center ${
                    isSkilled
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-variant text-on-surface border border-outline"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {isSkilled ? "handyman" : "accessibility_new"}
                  </span>
                </div>
                <h4 className="font-headline-md text-headline-md text-on-surface ml-2">
                  {SKILL_LABELS[level]} Labour
                </h4>
                <span className="ml-auto bg-surface-variant text-on-surface font-label-caps text-label-caps px-3 py-1 rounded-full">
                  {items.length} {items.length === 1 ? "Role" : "Roles"}
                </span>
              </div>
              <div className="space-y-stack-md">
                {items.map((l) => (
                  <div key={l.id} className="border-b border-outline-variant/50 pb-stack-md last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="font-table-data text-table-data text-on-surface">{l.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-table-data text-table-data font-bold">
                          {formatInr(l.dailyRate)}
                        </span>
                        <span className="text-outline font-label-caps text-label-caps w-20 text-right">
                          {UNIT_LABELS[l.unit]}
                        </span>
                      </div>
                    </div>
                    {l.productivityUnit && l.productivityRate != null && (
                      <p className="font-table-data text-table-data text-on-surface-variant mt-1">
                        {l.productivityRate} {l.productivityUnit} / day
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => startEdit(l)}
                        className="text-primary font-table-data text-table-data hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${l.name}"?`)) deleteLabour.mutate(l.id);
                        }}
                        className="text-error font-table-data text-table-data hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
