import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { useProject } from "../context/ProjectContext";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { api } from "@/services/api";
import { isVolumeUnit } from "@/domain/schemas";

type BoqLineRow = {
  id: string;
  itemNo: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
};

export default function BOQ() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeProjectId = useProjectUiStore((s) => s.activeProjectId);
  const { measureRows, calculateQty } = useProject();
  const virtualParentRef = useRef<HTMLDivElement>(null);

  const { data: boqData } = useQuery({
    queryKey: ["boq-versions", activeProjectId],
    queryFn: () =>
      api.fetch<{ versions: { id: string; version: number; label: string | null; lines: BoqLineRow[] }[] }>(
        `/api/projects/${activeProjectId}/boq/versions`,
      ),
    enabled: Boolean(activeProjectId && api.getToken()),
  });

  const latest = boqData?.versions?.[0];
  const flatLines = latest?.lines ?? [];

  const rowVirtualizer = useVirtualizer({
    count: flatLines.length,
    getScrollElement: () => virtualParentRef.current,
    estimateSize: () => 40,
    overscan: 8,
  });

  const createVersion = useMutation({
    mutationFn: () =>
      api.fetch(`/api/projects/${activeProjectId}/boq/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boq-versions", activeProjectId] });
    },
  });

  const totalVolume = measureRows.reduce((acc, row) => {
    if (!isVolumeUnit(row.unit)) return acc;
    return acc + calculateQty(row);
  }, 0);

  // 1.0 Site Preparation & Excavation
  const siteClearanceQty = 2500;
  const siteClearanceRate = 4.0;
  const siteClearanceAmount = siteClearanceQty * siteClearanceRate;

  const excavationFromServer = flatLines.find((l) => l.itemNo === "1.02");
  const excavationQty = excavationFromServer?.quantity ?? totalVolume;
  const excavationRate = 15.0;
  const excavationAmount = excavationQty * excavationRate;

  const subtotal1 = siteClearanceAmount + excavationAmount;

  // 2.0 Substructure Concrete
  // Normally concrete is a proportion of excavation. Let's use the totalVolume for concrete as well,
  // or a slightly adjusted value, but for simplicity we'll bind it directly to `totalVolume`
  // so the user sees that quantities update. The user request previously had 320m³ and 45 tonnes.
  // 45 / 320 = 0.1406 tonnes/m³ (~ 140kg/m³).
  const concreteQty = totalVolume; // using totalVolume directly to link it to measurements
  const concreteRate = 250.0;
  const concreteAmount = concreteQty * concreteRate;

  const steelQty = concreteQty * 0.1406;
  const steelRate = 1800.0;
  const steelAmount = steelQty * steelRate;

  const subtotal2 = concreteAmount + steelAmount;
  
  const subtotal = subtotal1 + subtotal2;
  const contingency = subtotal * 0.05;
  const tax = subtotal * 0.15;
  const grandTotal = subtotal + contingency + tax;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  return (
    <div className="flex flex-col gap-stack-lg pb-40">
      <div className="flex flex-col md:flex-row gap-gutter justify-between items-start md:items-end">
        <div>
          <h2 className="font-display-metrics text-display-metrics text-on-surface mb-stack-sm">Bill of Quantities</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Detailed line-item breakdown for cost estimation and material procurement.</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-gutter flex flex-col gap-stack-sm w-full md:w-auto min-w-[250px]">
          <div className="flex justify-between items-center w-full">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Version</span>
            <span className="font-table-data text-table-data text-on-surface">
              {latest ? `v${latest.version}${latest.label ? ` — ${latest.label}` : ""}` : "Local (not snapshotted)"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!activeProjectId || createVersion.isPending}
              onClick={() => createVersion.mutate()}
              className="h-9 px-3 rounded-lg bg-primary text-on-primary text-sm disabled:opacity-50"
            >
              Save BOQ version
            </button>
            {latest && (
              <button
                type="button"
                className="h-9 px-3 rounded-lg border border-outline text-sm"
                onClick={async () => {
                  const token = api.getToken();
                  if (!token || !activeProjectId) return;
                  const r = await fetch(
                    `/api/projects/${activeProjectId}/reports/boq/${latest.id}/pdf`,
                    { headers: { Authorization: `Bearer ${token}` } },
                  );
                  const blob = await r.blob();
                  window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
                }}
              >
                Export HTML
              </button>
            )}
          </div>
          <div className="flex justify-between items-center w-full mt-stack-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Status</span>
            <span className="bg-surface-variant text-on-surface-variant font-label-caps text-label-caps px-3 py-1 rounded-full">Pending Approval</span>
          </div>
        </div>
      </div>

      {flatLines.length > 0 && (
        <div className="border border-outline-variant rounded-lg p-stack-md bg-surface-container-lowest">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
            Server snapshot lines (virtualized)
          </p>
          <div ref={virtualParentRef} className="max-h-52 overflow-auto relative border border-outline-variant rounded-md bg-surface">
            <div style={{ height: rowVirtualizer.getTotalSize() }} className="relative w-full">
              {rowVirtualizer.getVirtualItems().map((v) => {
                const line = flatLines[v.index];
                return (
                  <div
                    key={line.id}
                    className="absolute left-0 right-0 px-3 flex items-center gap-3 border-b border-outline-variant text-sm"
                    style={{ height: v.size, transform: `translateY(${v.start}px)` }}
                  >
                    <span className="w-12 shrink-0 text-on-surface-variant">{line.itemNo}</span>
                    <span className="flex-1 truncate text-on-surface">{line.description}</span>
                    <span className="w-16 text-right">{line.quantity}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-gutter">
        {/* Category 1 */}
        <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="bg-surface-container-low p-stack-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">landscape</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">1.0 Site Preparation & Excavation</h3>
            </div>
            <div className="flex items-center">
              <span className="font-headline-md text-headline-md text-on-surface sm:text-right font-bold w-full sm:w-auto">{formatCurrency(subtotal1)}</span>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[80px_1fr_80px_100px_120px_120px] gap-gutter p-gutter border-b border-outline-variant bg-surface-container-lowest items-center">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Item #</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">Description</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Unit</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Qty</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Rate</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Amount</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_80px_100px_120px_120px] gap-gutter px-gutter py-stack-md border-b border-surface-variant hover:bg-surface-container-low transition-colors items-start">
                <span className="font-table-data text-table-data text-on-surface-variant">1.01</span>
                <span className="font-body-md text-body-md text-on-surface">Clear site of all vegetation, scrub, and debris.</span>
                <span className="font-table-data text-table-data text-on-surface text-right">m²</span>
                <span className="font-table-data text-table-data text-on-surface text-right">{formatNumber(siteClearanceQty)}</span>
                <span className="font-table-data text-table-data text-on-surface text-right">{formatCurrency(siteClearanceRate)}</span>
                <span className="font-table-data text-table-data text-on-surface font-semibold text-right">{formatCurrency(siteClearanceAmount)}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_80px_100px_120px_120px] gap-gutter px-gutter py-stack-md border-b border-surface-variant bg-surface-bright hover:bg-surface-container-low transition-colors items-start">
                <span className="font-table-data text-table-data text-on-surface-variant">1.02</span>
                <span className="font-body-md text-body-md text-on-surface">Bulk excavation for foundations up to 2m depth.</span>
                <span className="font-table-data text-table-data text-on-surface text-right">m³</span>
                <span className="font-table-data text-table-data text-on-surface text-right">{formatNumber(excavationQty)}</span>
                <span className="font-table-data text-table-data text-on-surface text-right">{formatCurrency(excavationRate)}</span>
                <span className="font-table-data text-table-data text-on-surface font-semibold text-right">{formatCurrency(excavationAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category 2 */}
        <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="bg-surface-container-low p-stack-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">foundation</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">2.0 Substructure Concrete</h3>
            </div>
            <div className="flex items-center">
              <span className="font-headline-md text-headline-md text-on-surface sm:text-right font-bold w-full sm:w-auto">{formatCurrency(subtotal2)}</span>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[80px_1fr_80px_100px_120px_120px] gap-gutter p-gutter border-b border-outline-variant bg-surface-container-lowest items-center">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Item #</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">Description</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Unit</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Qty</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Rate</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Amount</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_80px_100px_120px_120px] gap-gutter px-gutter py-stack-md border-b border-surface-variant hover:bg-surface-container-low transition-colors items-start">
                <span className="font-table-data text-table-data text-on-surface-variant">2.01</span>
                <span className="font-body-md text-body-md text-on-surface">In-situ concrete grade C30/37 in strip foundations.</span>
                <span className="font-table-data text-table-data text-on-surface text-right">m³</span>
                <span className="font-table-data text-table-data text-on-surface text-right">{formatNumber(concreteQty)}</span>
                <span className="font-table-data text-table-data text-on-surface text-right">{formatCurrency(concreteRate)}</span>
                <span className="font-table-data text-table-data text-on-surface font-semibold text-right">{formatCurrency(concreteAmount)}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_80px_100px_120px_120px] gap-gutter px-gutter py-stack-md border-b border-surface-variant bg-surface-bright hover:bg-surface-container-low transition-colors items-start">
                <span className="font-table-data text-table-data text-on-surface-variant">2.02</span>
                <span className="font-body-md text-body-md text-on-surface">High-yield reinforcing steel bars (T16-T20).</span>
                <span className="font-table-data text-table-data text-on-surface text-right">tonne</span>
                <span className="font-table-data text-table-data text-on-surface text-right">{formatNumber(steelQty)}</span>
                <span className="font-table-data text-table-data text-on-surface text-right">{formatCurrency(steelRate)}</span>
                <span className="font-table-data text-table-data text-on-surface font-semibold text-right">{formatCurrency(steelAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-stack-lg flex justify-end">
        <div className="w-full md:w-[400px] bg-surface-container-low border border-outline-variant rounded-lg p-margin-mobile flex flex-col gap-stack-sm">
          <div className="flex justify-between items-center py-2">
            <span className="font-table-data text-table-data text-on-surface-variant">Subtotal</span>
            <span className="font-headline-md text-headline-md text-on-surface">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-surface-variant">
            <span className="font-table-data text-table-data text-on-surface-variant">Contingency (5%)</span>
            <span className="font-table-data text-table-data text-on-surface">{formatCurrency(contingency)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-surface-variant">
            <span className="font-table-data text-table-data text-on-surface-variant">Tax / VAT (15%)</span>
            <span className="font-table-data text-table-data text-on-surface">{formatCurrency(tax)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 md:bottom-2 lg:bottom-4 px-margin-mobile py-stack-md w-full md:w-[calc(100%-20rem)] right-0 bg-surface border-t border-outline-variant flex flex-col md:flex-row justify-between items-center z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] md:mb-0 mb-safe gap-stack-md">
        <div className="flex flex-col mb-stack-md md:mb-0 w-full md:w-auto">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Grand Total Estimate</span>
          <span className="font-display-metrics text-display-metrics text-primary leading-none">{formatCurrency(grandTotal)}</span>
        </div>
        <div className="flex gap-gutter w-full md:w-auto">
          <button onClick={() => window.print()} className="flex-1 md:flex-none border border-outline-variant text-on-surface font-table-data text-table-data h-touch-target-min px-6 rounded-lg flex items-center justify-center hover:bg-surface-container-low transition-colors active:scale-95">
            Export PDF
          </button>
          <button onClick={() => navigate('/projects')} className="flex-1 md:flex-none bg-secondary text-on-secondary font-table-data text-table-data h-touch-target-min px-8 rounded-lg flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity active:scale-95">
            Approve BOQ
          </button>
        </div>
      </div>
    </div>
  );
}

