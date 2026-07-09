import type { MeasurementUnit } from "@/domain/schemas";
import {
  MEASUREMENT_UNITS,
  MEASUREMENT_UNIT_LABELS,
  filterUnits,
} from "@/domain/schemas";
import { UnitCombobox } from "./UnitCombobox";
import { formatInr } from "@/lib/formatCurrency";

export interface BoqLineMobile {
  id: string;
  itemNo: string;
  description: string;
  unit: MeasurementUnit | string;
  quantity: number;
  rate: number;
  amount: number;
}

interface MobileBoqFormProps {
  lines: BoqLineMobile[];
  selectedId: string;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<BoqLineMobile>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export function MobileBoqForm({
  lines,
  selectedId,
  onSelect,
  onUpdate,
  onAdd,
  onDelete,
}: MobileBoqFormProps) {
  const active = lines.find((l) => l.id === selectedId) ?? lines[0];

  if (!active) {
    return (
      <div className="lg:hidden border border-border-default rounded-lg p-4 text-text-muted text-center">
        No line items.{" "}
        <button type="button" onClick={onAdd} className="text-accent-primary ml-1">
          Add item
        </button>
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
        {lines.map((l) => (
          <option key={l.id} value={l.id}>
            {l.itemNo} — {l.description || "Untitled item"}
          </option>
        ))}
      </select>

      <div className="bg-bg-surface border border-border-default rounded-lg p-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-label text-label text-text-secondary">Item #</span>
          <input
            value={active.itemNo}
            onChange={(e) => onUpdate(active.id, { itemNo: e.target.value })}
            className="h-9 px-3 rounded-lg bg-bg-input border border-border-default font-mono"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label text-label text-text-secondary">Description</span>
          <input
            value={active.description}
            onChange={(e) => onUpdate(active.id, { description: e.target.value })}
            className="h-9 px-3 rounded-lg bg-bg-input border border-border-default"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-label text-label text-text-secondary">Quantity</span>
            <input
              type="number"
              value={active.quantity}
              onChange={(e) => {
                const quantity = Number(e.target.value);
                onUpdate(active.id, {
                  quantity,
                  amount: quantity * active.rate,
                });
              }}
              className="h-9 px-3 rounded-lg bg-bg-input border border-border-default font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-label text-text-secondary">Rate (₹)</span>
            <input
              type="number"
              value={active.rate}
              onChange={(e) => {
                const rate = Number(e.target.value);
                onUpdate(active.id, {
                  rate,
                  amount: active.quantity * rate,
                });
              }}
              className="h-9 px-3 rounded-lg bg-bg-input border border-border-default font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 col-span-2">
            <span className="font-label text-label text-text-secondary">Unit</span>
            <div className="h-9 rounded-lg bg-bg-input border border-border-default flex items-center">
              <UnitCombobox
                value={
                  (MEASUREMENT_UNITS as readonly string[]).includes(active.unit)
                    ? (active.unit as MeasurementUnit)
                    : "m³"
                }
                units={MEASUREMENT_UNITS}
                labels={MEASUREMENT_UNIT_LABELS}
                filterUnits={filterUnits}
                onChange={(u) => onUpdate(active.id, { unit: u })}
              />
            </div>
          </label>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border-default">
          <span className="font-label text-label text-text-muted">Amount</span>
          <span className="font-mono text-mono text-accent-primary font-semibold">
            {formatInr(active.amount)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onDelete(active.id)}
          className="h-10 rounded-lg border border-accent-danger/30 text-accent-danger hover:bg-accent-danger/10 transition-colors"
        >
          Delete item
        </button>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="h-10 rounded-lg border border-border-default text-text-primary"
      >
        + Add item
      </button>
    </div>
  );
}
