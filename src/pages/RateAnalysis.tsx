import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useProjectUiStore } from "@/features/project/projectUiStore";

export default function RateAnalysis() {
  const projectId = useProjectUiStore((s) => s.activeProjectId);
  const qc = useQueryClient();
  const [name, setName] = useState("Sample breakdown");
  const [m, setM] = useState(115);
  const [l, setL] = useState(92);
  const [e, setE] = useState(15);
  const [oh, setOh] = useState(5);
  const [pr, setPr] = useState(8);

  const { data: booksData } = useQuery({
    queryKey: ["rate-books", projectId],
    queryFn: () =>
      api.fetch<{
        books: { id: string; name: string; items: { code: string; description: string; rate: number }[] }[];
      }>(`/api/projects/${projectId}/rates/books`),
    enabled: Boolean(projectId && api.getToken()),
  });

  const { data: analysesData } = useQuery({
    queryKey: ["rate-analyses", projectId],
    queryFn: () =>
      api.fetch<{ analyses: { id: string; name: string; totalRate: number }[] }>(
        `/api/projects/${projectId}/rates/analyses`,
      ),
    enabled: Boolean(projectId && api.getToken()),
  });

  const saveAnalysis = useMutation({
    mutationFn: () =>
      api.fetch(`/api/projects/${projectId}/rates/analyses`, {
        method: "POST",
        body: JSON.stringify({
          name,
          materialCost: m,
          labourCost: l,
          equipmentCost: e,
          overheadPct: oh,
          profitPct: pr,
        }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["rate-analyses", projectId] }),
  });

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-sm border-b border-outline-variant pb-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Rate Analysis</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Cost breakdown for Base Rate items.</p>
        </div>
        <div className="flex items-center gap-base">
          <button className="h-touch-target-min px-4 bg-surface-container border border-outline text-on-surface rounded-lg font-table-data hover:bg-surface-variant transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined">tune</span> Adjust Margins
          </button>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        <div className="bg-surface-container-low p-margin-mobile flex justify-between items-center border-b border-outline-variant">
           <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant mb-1 block">Item Code: RA-241</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Concrete Grade C30/37, In-Situ</h3>
           </div>
           <div className="text-right flex flex-col">
              <span className="font-label-caps text-label-caps text-on-surface-variant mb-1 block">Total Derived Rate</span>
              <span className="font-display-metrics text-display-metrics text-primary">$250.00 <span className="text-body-lg text-outline">/ m³</span></span>
           </div>
        </div>
        
        {/* Material Component */}
        <div className="p-stack-lg border-b border-surface-variant">
           <h4 className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">inventory_2</span> A. Material Cost
           </h4>
           <div className="grid grid-cols-[1fr_100px_100px_120px] gap-gutter border-b border-outline-variant bg-surface-bright p-2 rounded-t">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Description</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Qty/Unit</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Rate</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Amount</span>
           </div>
           <div className="grid grid-cols-[1fr_100px_100px_120px] gap-gutter p-2 border-b border-surface-variant items-center hover:bg-surface-container-lowest transition-colors">
              <span className="font-table-data text-table-data text-on-surface">Portland Cement</span>
              <span className="font-table-data text-table-data text-on-surface text-right">350 kg</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$0.12</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$42.00</span>
           </div>
           <div className="grid grid-cols-[1fr_100px_100px_120px] gap-gutter p-2 border-b border-surface-variant items-center hover:bg-surface-container-lowest transition-colors">
              <span className="font-table-data text-table-data text-on-surface">Coarse Aggregate</span>
              <span className="font-table-data text-table-data text-on-surface text-right">1.2 tonne</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$25.00</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$30.00</span>
           </div>
           <div className="flex justify-end p-2 mt-2">
              <span className="font-table-data text-table-data text-on-surface-variant mr-4">Material Subtotal:</span>
              <span className="font-table-data text-table-data font-bold text-on-surface">$115.00</span>
           </div>
        </div>

        {/* Labour Component */}
        <div className="p-stack-lg border-b border-surface-variant">
           <h4 className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">engineering</span> B. Labour Cost
           </h4>
           <div className="grid grid-cols-[1fr_100px_100px_120px] gap-gutter border-b border-outline-variant bg-surface-bright p-2 rounded-t">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Role</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Hrs/Unit</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Rate/Hr</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant text-right">Amount</span>
           </div>
           <div className="grid grid-cols-[1fr_100px_100px_120px] gap-gutter p-2 border-b border-surface-variant items-center hover:bg-surface-container-lowest transition-colors">
              <span className="font-table-data text-table-data text-on-surface">Concreter (Skilled)</span>
              <span className="font-table-data text-table-data text-on-surface text-right">1.5</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$35.00</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$52.50</span>
           </div>
           <div className="grid grid-cols-[1fr_100px_100px_120px] gap-gutter p-2 border-b border-surface-variant items-center hover:bg-surface-container-lowest transition-colors">
              <span className="font-table-data text-table-data text-on-surface">General Helper</span>
              <span className="font-table-data text-table-data text-on-surface text-right">2.0</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$20.00</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$40.00</span>
           </div>
            <div className="flex justify-end p-2 mt-2">
              <span className="font-table-data text-table-data text-on-surface-variant mr-4">Labour Subtotal:</span>
              <span className="font-table-data text-table-data font-bold text-on-surface">$92.50</span>
           </div>
        </div>

        {/* Equipment & Overheads */}
        <div className="p-stack-lg bg-surface-container-lowest">
           <h4 className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">calculate</span> C. Equipment, Overheads & Margin
           </h4>
            <div className="flex justify-between p-2 border-b border-surface-variant items-center">
              <span className="font-table-data text-table-data text-on-surface">Vibrator/Mixer Equipment (Per m³)</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$15.00</span>
           </div>
           <div className="flex justify-between p-2 border-b border-surface-variant items-center">
              <span className="font-table-data text-table-data text-on-surface">Overheads (5% of A + B)</span>
              <span className="font-table-data text-table-data text-on-surface text-right">$10.37</span>
           </div>
           <div className="flex justify-between p-2 border-b border-primary items-center">
              <span className="font-table-data text-table-data text-on-surface font-bold text-primary">Contractor Profit Margin (8%)</span>
              <span className="font-table-data text-table-data text-on-surface font-bold text-primary text-right">$17.13</span>
           </div>
        </div>
      </div>

      {projectId && (
        <div className="border border-outline-variant rounded-xl p-stack-md bg-surface-container-lowest flex flex-col gap-stack-md">
          <h3 className="font-headline-md text-headline-md text-on-surface">Server rate book (read-only)</h3>
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
              Material
              <input type="number" value={m} onChange={(ev) => setM(Number(ev.target.value))} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Labour
              <input type="number" value={l} onChange={(ev) => setL(Number(ev.target.value))} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Equipment
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
            className="h-touch-target-min px-4 rounded-lg bg-primary text-on-primary disabled:opacity-50 w-fit"
          >
            Save rate analysis
          </button>
          <div className="text-sm text-on-surface-variant">
            Saved analyses: {(analysesData?.analyses ?? []).map((a) => (
              <span key={a.id} className="mr-3">
                {a.name}: {a.totalRate.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
