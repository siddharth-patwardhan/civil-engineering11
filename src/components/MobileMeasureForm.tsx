import type { MeasureRow } from "@/context/ProjectContext";
import { MEASUREMENT_UNITS, MEASUREMENT_UNIT_LABELS, filterUnits, type MeasurementUnit } from "@/domain/schemas";
import { UnitCombobox } from "./UnitCombobox";

interface MobileMeasureFormProps {
  rows: MeasureRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, field: keyof MeasureRow, value: string) => void;
  onAdd: () => void;
  quantityLabel: (row: MeasureRow) => string;
}

export function MobileMeasureForm({
  rows,
  selectedId,
  onSelect,
  onUpdate,
  onAdd,
  quantityLabel,
}: MobileMeasureFormProps) {
  const active = rows.find((r) => r.id === selectedId) ?? rows[0];

  if (!active) {
    return (
      <div className="lg:hidden border border-border-default rounded-lg p-4 text-text-muted text-center">
        No rows. <button onClick={onAdd} className="text-accent-primary ml-1">Add row</button>
      </div>
    );
  }

  return (
    <div className="lg:hidden flex flex-col gap-3">
      <select
        value={active.id}
        onChange={(e) => onSelect(e.target.value)}
        className="h-10 px-3 rounded-lg bg-bg-input border border-border-default text-text-primary"
      >
        {rows.map((r, i) => (
          <option key={r.id} value={r.id}>
            {i + 1}. {r.desc || "Untitled row"}
          </option>
        ))}
      </select>

      <div className="bg-bg-surface border border-border-default rounded-lg p-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-label text-label text-text-secondary">Description</span>
          <input
            value={active.desc}
            onChange={(e) => onUpdate(active.id, "desc", e.target.value)}
            className="h-9 px-3 rounded-lg bg-bg-input border border-border-default"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-label text-label text-text-secondary">No.</span>
            <input
              type="number"
              value={active.no}
              onChange={(e) => onUpdate(active.id, "no", e.target.value)}
              className="h-9 px-3 rounded-lg bg-bg-input border border-border-default font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-label text-text-secondary">Deduction</span>
            <input
              type="number"
              value={active.ded}
              onChange={(e) => onUpdate(active.id, "ded", e.target.value)}
              className="h-9 px-3 rounded-lg bg-bg-input border border-border-default font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-label text-text-secondary">Length</span>
            <input
              type="number"
              value={active.l}
              onChange={(e) => onUpdate(active.id, "l", e.target.value)}
              className="h-9 px-3 rounded-lg bg-bg-input border border-border-default font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-label text-text-secondary">Width</span>
            <input
              type="number"
              value={active.w}
              onChange={(e) => onUpdate(active.id, "w", e.target.value)}
              className="h-9 px-3 rounded-lg bg-bg-input border border-border-default font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-label text-text-secondary">Height</span>
            <input
              type="number"
              value={active.h}
              onChange={(e) => onUpdate(active.id, "h", e.target.value)}
              className="h-9 px-3 rounded-lg bg-bg-input border border-border-default font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-label text-text-secondary">Unit</span>
            <div className="h-9 rounded-lg bg-bg-input border border-border-default flex items-center">
              <UnitCombobox
                value={active.unit}
                units={MEASUREMENT_UNITS}
                labels={MEASUREMENT_UNIT_LABELS}
                filterUnits={filterUnits}
                onChange={(u) => onUpdate(active.id, "unit", u as MeasurementUnit)}
              />
            </div>
          </label>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border-default">
          <span className="font-label text-label text-text-muted">Quantity</span>
          <span className="font-mono text-mono text-accent-primary font-semibold">{quantityLabel(active)}</span>
        </div>
      </div>
      <button onClick={onAdd} className="h-10 rounded-lg border border-border-default text-text-primary">
        + Add row
      </button>
    </div>
  );
}
