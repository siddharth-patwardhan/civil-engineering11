import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { useActiveProjectId } from "@/features/project/useActiveProjectId";
import { showToast } from "@/components/ToastProvider";
import { UnitCombobox } from "@/components/UnitCombobox";
import {
  EQUIPMENT_UNITS,
  EQUIPMENT_UNIT_LABELS,
  filterUnits,
  type EquipmentUnit,
} from "@/domain/schemas";

interface EquipmentRow {
  id: string;
  name: string;
  category: string;
  rentalRate: number;
  unit: string;
  capacity: string | null;
}

const EMPTY_FORM = {
  name: "",
  category: "concreting",
  rentalRate: 0,
  unit: "day" as EquipmentUnit,
  capacity: "",
};

export default function RateAnalysis() {
  const projectId = useActiveProjectId();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("Sample breakdown");
  const [m, setM] = useState(115);
  const [l, setL] = useState(92);
  const [e, setE] = useState(15);
  const [oh, setOh] = useState(5);
  const [pr, setPr] = useState(8);
  const [boqLineId, setBoqLineId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: booksData, isLoading: isLoadingBooks, isError: isErrorBooks, error: errorBooks } = useQuery({
    queryKey: ["rate-books", projectId],
    queryFn: () =>
      api.fetch<{
        books: { id: string; name: string; items: { code: string; description: string; rate: number }[] }[];
      }>(`/api/projects/${projectId}/rates/books`),
    enabled: Boolean(projectId && isAuthenticated),
  });

  const { data: analysesData, isLoading: isLoadingAnalyses, isError: isErrorAnalyses, error: errorAnalyses } = useQuery({
    queryKey: ["rate-analyses", projectId],
    queryFn: () =>
      api.fetch<{ analyses: { id: string; name: string; totalRate: number }[] }>(
        `/api/projects/${projectId}/rates/analyses`,
      ),
    enabled: Boolean(projectId && isAuthenticated),
  });

  const { data: equipmentData, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ["equipment", projectId],
    queryFn: () => api.fetch<{ equipment: EquipmentRow[] }>(`/api/projects/${projectId}/equipment`),
    enabled: Boolean(projectId && isAuthenticated),
  });

  const { data: boqData } = useQuery({
    queryKey: ["boq-versions", projectId],
    queryFn: () =>
      api.fetch<{ versions: { id: string; lines: { id: string; itemNo: string; description: string }[] }[] }>(
        `/api/projects/${projectId}/boq/versions`,
      ),
    enabled: Boolean(projectId && isAuthenticated),
  });

  const { data: materialsData } = useQuery({
    queryKey: ["materials", projectId],
    queryFn: () => api.fetch<{ materials: { latestRate: number | null }[] }>(`/api/projects/${projectId}/materials`),
    enabled: Boolean(projectId && isAuthenticated),
  });

  const { data: labourData } = useQuery({
    queryKey: ["labour", projectId],
    queryFn: () => api.fetch<{ labour: { dailyRate: number }[] }>(`/api/projects/${projectId}/labour`),
    enabled: Boolean(projectId && isAuthenticated),
  });

  const boqLines = boqData?.versions?.[0]?.lines ?? [];

  const materialsSubtotal = useMemo(
    () => (materialsData?.materials ?? []).reduce((s, m) => s + (m.latestRate ?? 0), 0),
    [materialsData],
  );
  const labourSubtotal = useMemo(
    () => (labourData?.labour ?? []).reduce((s, lb) => s + lb.dailyRate, 0),
    [labourData],
  );

  const effectiveM = materialsSubtotal > 0 ? materialsSubtotal : m;
  const effectiveL = labourSubtotal > 0 ? labourSubtotal : l;

  const equipmentList = equipmentData?.equipment ?? [];

  const equipmentSubtotal = useMemo(
    () => equipmentList.reduce((s, eq) => s + eq.rentalRate, 0),
    [equipmentList],
  );

  const saveEquipment = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        category: form.category,
        rentalRate: form.rentalRate,
        unit: form.unit,
        capacity: form.capacity.trim() || undefined,
      };
      if (editingId) {
        return api.fetch(`/api/projects/${projectId}/equipment/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      return api.fetch(`/api/projects/${projectId}/equipment`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["equipment", projectId] });
      setForm(EMPTY_FORM);
      setEditingId(null);
      showToast(editingId ? "Equipment updated" : "Equipment added", "success");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  const deleteEquipment = useMutation({
    mutationFn: (id: string) =>
      api.fetch(`/api/projects/${projectId}/equipment/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["equipment", projectId] });
      showToast("Equipment removed", "info");
    },
    onError: (err) => showToast(String(err), "error"),
  });

  const saveAnalysis = useMutation({
    mutationFn: () =>
      api.fetch(`/api/projects/${projectId}/rates/analyses`, {
        method: "POST",
        body: JSON.stringify({
          name,
          boqLineId: boqLineId || undefined,
          materialCost: effectiveM,
          labourCost: effectiveL,
          equipmentCost: equipmentSubtotal > 0 ? equipmentSubtotal : e,
          overheadPct: oh,
          profitPct: pr,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["rate-analyses", projectId] });
      void qc.invalidateQueries({ queryKey: ["boq-versions", projectId] });
      showToast(boqLineId ? "Rate saved and applied to BOQ line" : "Rate analysis saved", "success");
    },
  });

  const fmtInr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  const derivedRate = effectiveM + effectiveL + (equipmentSubtotal > 0 ? equipmentSubtotal : e);
  const overheadAmt = derivedRate * (oh / 100);
  const profitAmt = (derivedRate + overheadAmt) * (pr / 100);
  const totalRate = derivedRate + overheadAmt + profitAmt;

  const startEdit = (eq: EquipmentRow) => {
    setEditingId(eq.id);
    setForm({
      name: eq.name,
      category: eq.category,
      rentalRate: eq.rentalRate,
      unit: (EQUIPMENT_UNITS as readonly string[]).includes(eq.unit) ? (eq.unit as EquipmentUnit) : "day",
      capacity: eq.capacity ?? "",
    });
  };

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-sm border-b border-outline-variant pb-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Rate Analysis</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Cost breakdown for base rate items — linked to project equipment library.
          </p>
        </div>
      </div>

      {!projectId && (
        <div className="border border-outline-variant rounded-lg p-4 text-on-surface-variant">
          Select a project to manage equipment and rate analyses.
        </div>
      )}

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        <div className="bg-surface-container-low p-margin-mobile flex justify-between items-center border-b border-outline-variant">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-1 block">Item: Concrete C30/37</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">In-situ concrete — rate build-up</h3>
          </div>
          <div className="text-right flex flex-col">
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-1 block">Total derived rate</span>
            <span className="font-display-metrics text-display-metrics text-primary">
              {fmtInr(totalRate)} <span className="text-body-lg text-outline">/ m³</span>
            </span>
          </div>
        </div>

        <div className="p-stack-lg border-b border-surface-variant">
          <h4 className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">inventory_2</span> A. Material cost
          </h4>
          <div className="flex justify-end p-2">
            <span className="font-table-data text-table-data text-on-surface-variant mr-4">Material subtotal:</span>
            <span className="font-table-data text-table-data font-bold text-on-surface">{fmtInr(effectiveM)}</span>
            {materialsSubtotal > 0 && (
              <p className="text-xs text-on-surface-variant text-right mt-1">From material library ({materialsData?.materials.length} items)</p>
            )}
          </div>
        </div>

        <div className="p-stack-lg border-b border-surface-variant">
          <h4 className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">engineering</span> B. Labour cost
          </h4>
          <div className="flex justify-end p-2">
            <span className="font-table-data text-table-data text-on-surface-variant mr-4">Labour subtotal:</span>
            <span className="font-table-data text-table-data font-bold text-on-surface">{fmtInr(effectiveL)}</span>
            {labourSubtotal > 0 && (
              <p className="text-xs text-on-surface-variant text-right mt-1">From labour library ({labourData?.labour.length} roles)</p>
            )}
          </div>
        </div>

        <div className="p-stack-lg bg-surface-container-lowest">
          <h4 className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">construction</span> C. Equipment (editable)
          </h4>

          {isLoadingEquipment && <p className="text-sm text-on-surface-variant">Loading equipment…</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant">
                  <th className="text-left py-2 pr-2">Name</th>
                  <th className="text-left py-2 pr-2">Category</th>
                  <th className="text-right py-2 pr-2">Rate</th>
                  <th className="text-center py-2 pr-2">Unit</th>
                  <th className="text-left py-2 pr-2">Capacity</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map((eq) => (
                  <tr key={eq.id} className="border-b border-surface-variant hover:bg-surface-container-low">
                    <td className="py-2 pr-2 text-on-surface">{eq.name}</td>
                    <td className="py-2 pr-2 text-on-surface-variant">{eq.category}</td>
                    <td className="py-2 pr-2 text-right font-mono">{fmtInr(eq.rentalRate)}</td>
                    <td className="py-2 pr-2 text-center font-mono">{eq.unit}</td>
                    <td className="py-2 pr-2 text-on-surface-variant">{eq.capacity ?? "—"}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => startEdit(eq)} className="text-primary mr-2 hover:underline">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEquipment.mutate(eq.id)}
                        className="text-error hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {equipmentList.length === 0 && !isLoadingEquipment && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-on-surface-variant">
                      No equipment yet. Add items below or run db:seed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 border border-outline-variant rounded-lg bg-surface">
            <label className="flex flex-col gap-1 text-sm">
              Name
              <input
                value={form.name}
                onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
                className="border rounded px-2 py-1"
                placeholder="e.g. Concrete Vibrator"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Category
              <select
                value={form.category}
                onChange={(ev) => setForm((f) => ({ ...f, category: ev.target.value }))}
                className="border rounded px-2 py-1"
              >
                <option value="concreting">Concreting</option>
                <option value="earthwork">Earthwork</option>
                <option value="lifting">Lifting</option>
                <option value="steel">Steel</option>
                <option value="finishing">Finishing</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Rental rate (₹)
              <input
                type="number"
                value={form.rentalRate}
                onChange={(ev) => setForm((f) => ({ ...f, rentalRate: Number(ev.target.value) }))}
                className="border rounded px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Unit
              <div className="border rounded px-1 py-0.5">
                <UnitCombobox
                  value={form.unit}
                  units={EQUIPMENT_UNITS}
                  labels={EQUIPMENT_UNIT_LABELS}
                  filterUnits={filterUnits}
                  onChange={(u) => setForm((f) => ({ ...f, unit: u }))}
                />
              </div>
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              Capacity
              <input
                value={form.capacity}
                onChange={(ev) => setForm((f) => ({ ...f, capacity: ev.target.value }))}
                className="border rounded px-2 py-1"
                placeholder="e.g. 6 m³, 1.5 kW"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                disabled={!projectId || !form.name.trim() || saveEquipment.isPending}
                onClick={() => saveEquipment.mutate()}
                className="h-9 px-4 rounded-lg bg-primary text-on-primary disabled:opacity-50"
              >
                {editingId ? "Update" : "Add"} equipment
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                  className="h-9 px-3 rounded-lg border border-outline"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end p-2 mt-3">
            <span className="font-table-data text-table-data text-on-surface-variant mr-4">Equipment subtotal:</span>
            <span className="font-table-data text-table-data font-bold text-on-surface">
              {fmtInr(equipmentSubtotal > 0 ? equipmentSubtotal : e)}
            </span>
          </div>
        </div>
      </div>

      {projectId && (
        <div className="border border-outline-variant rounded-xl p-stack-md bg-surface-container-lowest flex flex-col gap-stack-md">
          <h3 className="font-headline-md text-headline-md text-on-surface">Save rate analysis</h3>
          {isLoadingBooks && <p className="text-text-secondary">Loading rate books...</p>}
          {isErrorBooks && <p className="text-error">Failed to load rate books: {(errorBooks as Error)?.message}</p>}
          {(booksData?.books ?? []).map((b) => (
            <div key={b.id} className="text-sm text-on-surface-variant">
              <strong className="text-on-surface">{b.name}</strong>
              <ul className="list-disc pl-5 mt-1">
                {b.items.slice(0, 6).map((i) => (
                  <li key={i.code}>
                    {i.code}: {i.description} @ {i.rate}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Name
              <input value={name} onChange={(ev) => setName(ev.target.value)} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Link to BOQ line (applies total rate on save)
              <select value={boqLineId} onChange={(ev) => setBoqLineId(ev.target.value)} className="border rounded px-2 py-1">
                <option value="">— None —</option>
                {boqLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.itemNo}: {line.description}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Material (₹)
              <input type="number" value={m} onChange={(ev) => setM(Number(ev.target.value))} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Labour (₹)
              <input type="number" value={l} onChange={(ev) => setL(Number(ev.target.value))} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Equipment fallback (₹) — used if library empty
              <input type="number" value={e} onChange={(ev) => setE(Number(ev.target.value))} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              OH %
              <input type="number" value={oh} onChange={(ev) => setOh(Number(ev.target.value))} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Profit %
              <input type="number" value={pr} onChange={(ev) => setPr(Number(ev.target.value))} className="border rounded px-2 py-1" />
            </label>
          </div>
          <button
            type="button"
            disabled={!projectId || saveAnalysis.isPending}
            onClick={() => saveAnalysis.mutate()}
            className="h-touch-target-min px-4 rounded-lg bg-primary text-on-primary disabled:opacity-50 w-fit flex items-center justify-center gap-2"
          >
            {saveAnalysis.isPending && <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>}
            {saveAnalysis.isPending ? "Saving..." : "Save rate analysis"}
          </button>
          <div className="text-sm text-on-surface-variant mt-4">
            {isLoadingAnalyses && <p className="text-text-secondary">Loading analyses...</p>}
            {isErrorAnalyses && <p className="text-error">Failed to load analyses: {(errorAnalyses as Error)?.message}</p>}
            Saved analyses: {(analysesData?.analyses ?? []).map((a) => (
              <span key={a.id} className="mr-3">
                {a.name}: {fmtInr(a.totalRate)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
