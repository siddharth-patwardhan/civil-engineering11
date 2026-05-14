import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import { useProject, MeasureRow } from '../context/ProjectContext';
import { ELEMENT_TEMPLATES } from '@/domain/templates';
import { MEASUREMENT_UNITS, MEASUREMENT_UNIT_LABELS } from '@/domain/schemas';
import { totalsByUnit } from '@/domain/measurementTotals';

export default function Measurement() {
  const navigate = useNavigate();
  const { measureRows: rows, setMeasureRows: setRows, quantityResult, activeProjectId, pullFromServer, pushToServer } = useProject();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const unitTotals = useMemo(
    () => totalsByUnit(rows, (r) => quantityResult(r)),
    [rows, quantityResult],
  );

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString(), desc: '', no: '', l: '', w: '', h: '', unit: 'm³' }]);
  };

  const updateRow = (id: string, field: keyof MeasureRow, value: string) => {
    console.log(`[Measurement] updateRow - id: ${id}, field: ${field}, value: ${value}`);
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-stack-lg pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-stack-md">
        <div>
          <div className="flex items-center gap-3">
            <p className="font-label-caps text-label-caps text-on-surface-variant">Task CE-2024-01-A</p>
            <span className="bg-surface-container text-on-surface px-2 py-0.5 rounded font-label-caps text-label-caps border border-outline-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Draft
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">Foundation Excavation</h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center border border-outline-variant rounded-xl p-stack-md bg-surface-container-lowest">
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="font-label-caps text-label-caps text-on-surface-variant">Structure template</label>
          <select
            className="h-touch-target-min px-3 rounded-lg border border-outline bg-surface text-on-surface"
            defaultValue=""
            onChange={(e) => {
              const key = e.target.value;
              if (!key) return;
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
              e.target.value = '';
            }}
          >
            <option value="">Add from template…</option>
            {ELEMENT_TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            disabled={!activeProjectId}
            onClick={async () => {
              setSyncMsg(null);
              try {
                await pullFromServer();
                setSyncMsg('Loaded from server.');
              } catch (err) {
                setSyncMsg(String(err));
              }
            }}
            className="h-touch-target-min px-4 rounded-lg border border-outline text-on-surface font-table-data disabled:opacity-50"
          >
            Pull from server
          </button>
          <button
            type="button"
            disabled={!activeProjectId}
            onClick={async () => {
              setSyncMsg(null);
              try {
                await pushToServer();
                setSyncMsg('Saved to server.');
              } catch (err) {
                setSyncMsg(String(err));
              }
            }}
            className="h-touch-target-min px-4 rounded-lg bg-primary text-on-primary font-table-data disabled:opacity-50"
          >
            Push to server
          </button>
          {syncMsg && <span className="font-body-sm text-on-surface-variant max-w-xs">{syncMsg}</span>}
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <div className="min-w-[900px] w-full">
            {/* Header */}
            <div className="grid grid-cols-[1fr_60px_80px_80px_80px_100px_80px_48px] bg-surface-container-low border-b border-outline-variant sticky top-0 z-30 shadow-sm">
              <div className="p-base font-label-caps text-label-caps text-on-surface-variant flex items-center border-r border-outline-variant">Description</div>
              <div className="p-base font-label-caps text-label-caps text-on-surface-variant flex items-center border-r border-outline-variant justify-center">No.</div>
              <div className="p-base font-label-caps text-label-caps text-on-surface-variant flex items-center border-r border-outline-variant justify-center">Length</div>
              <div className="p-base font-label-caps text-label-caps text-on-surface-variant flex items-center border-r border-outline-variant justify-center">Width</div>
              <div className="p-base font-label-caps text-label-caps text-on-surface-variant flex items-center border-r border-outline-variant justify-center">Height</div>
              <div className="p-base font-label-caps text-label-caps text-primary flex items-center border-r border-outline-variant justify-end pr-4">Quantity</div>
              <div className="p-base font-label-caps text-label-caps text-on-surface-variant flex items-center border-r border-outline-variant justify-center">Unit</div>
              <div className="p-base flex items-center justify-center text-outline"><span className="material-symbols-outlined text-[18px]">more_vert</span></div>
            </div>

            {/* Rows */}
            {rows.map((row, i) => {
              const qtyRes = quantityResult(row);
              const qty = qtyRes.ok ? qtyRes.quantity : 0;
              const isEven = i % 2 === 0;
              return (
                <div key={row.id} className={cn(
                  "grid grid-cols-[1fr_60px_80px_80px_80px_100px_80px_48px] border-b border-surface-variant hover:bg-surface-container-lowest transition-colors group relative",
                  isEven ? "bg-surface" : "bg-surface-bright"
                )}>
                  <div className="p-stack-sm border-r border-surface-variant bg-transparent z-10 relative flex">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-outline-variant group-hover:bg-primary transition-colors"></div>
                    <input type="text" value={row.desc} onChange={e => updateRow(row.id, 'desc', e.target.value)} className="w-full flex-grow h-[40px] ml-2 bg-transparent border border-transparent focus:border-outline focus:bg-surface-container-lowest px-2 font-table-data text-table-data text-on-surface outline-none rounded" placeholder="Description" />
                  </div>
                  <div className="p-stack-sm border-r border-surface-variant bg-transparent z-10"><input type="number" value={row.no} onChange={e => updateRow(row.id, 'no', e.target.value)} className="w-full h-[40px] bg-transparent border border-transparent focus:border-outline focus:bg-surface-container-lowest px-2 font-table-data text-table-data text-on-surface text-center outline-none rounded appearance-none" placeholder="-" /></div>
                  <div className="p-stack-sm border-r border-surface-variant bg-transparent z-10"><input type="number" value={row.l} onChange={e => updateRow(row.id, 'l', e.target.value)} className="w-full h-[40px] bg-transparent border border-transparent focus:border-outline focus:bg-surface-container-lowest px-2 font-table-data text-table-data text-on-surface text-center outline-none rounded appearance-none" placeholder="-" /></div>
                  <div className="p-stack-sm border-r border-surface-variant bg-transparent z-10"><input type="number" value={row.w} onChange={e => updateRow(row.id, 'w', e.target.value)} className="w-full h-[40px] bg-transparent border border-transparent focus:border-outline focus:bg-surface-container-lowest px-2 font-table-data text-table-data text-on-surface text-center outline-none rounded appearance-none" placeholder="-" /></div>
                  <div className="p-stack-sm border-r border-surface-variant bg-transparent z-10"><input type="number" value={row.h} onChange={e => updateRow(row.id, 'h', e.target.value)} className="w-full h-[40px] bg-transparent border border-transparent focus:border-outline focus:bg-surface-container-lowest px-2 font-table-data text-table-data text-on-surface text-center outline-none rounded appearance-none" placeholder="-" /></div>
                  <div className="p-stack-sm border-r border-surface-variant bg-surface-container z-10 flex items-center justify-end px-4 flex-col gap-0.5">
                    <span className={cn("font-table-data text-table-data", qty > 0 ? "font-bold text-primary" : "text-outline-variant")}>{qty.toFixed(2)}</span>
                    {!qtyRes.ok && (
                      <span className="text-[10px] text-error text-right leading-tight max-w-[90px]">{qtyRes.error}</span>
                    )}
                  </div>
                  <div className="p-stack-sm border-r border-surface-variant bg-transparent z-10 relative">
                    <select value={row.unit} onChange={e => updateRow(row.id, 'unit', e.target.value as MeasureRow['unit'])} className="w-full h-[40px] bg-transparent border border-transparent focus:border-outline focus:bg-surface-container-lowest px-1 font-table-data text-table-data text-on-surface outline-none appearance-none text-center rounded cursor-pointer">
                      {MEASUREMENT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {MEASUREMENT_UNIT_LABELS[u]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="p-stack-sm bg-transparent z-10 flex items-center justify-center cursor-pointer text-outline-variant hover:bg-error-container hover:text-on-error-container transition-colors rounded" onClick={() => deleteRow(row.id)}>
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer / Floating actions */}
      <div className="fixed bottom-0 md:bottom-2 lg:bottom-4 px-margin-mobile py-stack-md w-full md:w-[calc(100%-20rem)] right-0 bg-surface border-t border-outline-variant flex flex-col md:flex-row justify-between items-center z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] md:mb-0 mb-safe gap-stack-md">
        <div className="flex flex-col w-full md:w-auto gap-2">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            Subtotals by unit
          </span>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            {unitTotals.length === 0 ? (
              <span className="font-body-md text-outline">—</span>
            ) : (
              unitTotals.map(({ unit, total, rowsWithError }) => (
                <div key={unit} className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display-metrics text-display-metrics text-primary leading-none">
                      {total.toFixed(2)}
                    </span>
                    <span className="font-headline-md text-headline-md text-outline">{unit}</span>
                  </div>
                  {rowsWithError > 0 && (
                    <span className="text-[11px] text-error leading-tight">
                      {rowsWithError} row{rowsWithError > 1 ? "s" : ""} need valid dims for {unit}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex gap-gutter w-full md:w-auto">
          <button className="flex-none border border-outline-variant bg-surface-container-lowest text-on-surface h-touch-target-min px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm active:scale-95">
            <span className="material-symbols-outlined">mic</span>
          </button>
          <button onClick={addRow} className="flex-1 md:flex-none border border-outline-variant text-on-surface font-table-data text-table-data h-touch-target-min px-6 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:bg-surface-container-low active:scale-95 transition-all">
            <span className="material-symbols-outlined">add</span>
            Add Row
          </button>
          <button onClick={() => navigate('/boq')} className="flex-1 md:flex-none bg-secondary text-on-secondary font-table-data text-table-data h-touch-target-min px-8 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:bg-[#3b39c6] active:scale-95 transition-all">
            Review BOQ
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
