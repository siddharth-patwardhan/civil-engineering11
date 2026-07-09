import { useState, useRef, useEffect, useMemo, useId } from "react";
import { cn } from "@/lib/utils";

interface UnitComboboxProps<T extends string> {
  value: T;
  units: readonly T[];
  labels: Record<T, string>;
  onChange: (unit: T) => void;
  filterUnits: (units: readonly T[], labels: Record<T, string>, query: string) => T[];
  className?: string;
  placeholder?: string;
}

export function UnitCombobox<T extends string>({
  value,
  units,
  labels,
  onChange,
  filterUnits,
  className,
  placeholder = "Search unit…",
}: UnitComboboxProps<T>) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => filterUnits(units, labels, query),
    [units, labels, query, filterUnits],
  );

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const select = (u: T) => {
    onChange(u);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-transparent border-none outline-none text-text-primary font-table text-table text-center focus:ring-0 cursor-pointer truncate px-1"
        title={labels[value]}
      >
        {value}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-lg overflow-hidden min-w-[220px]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="w-full px-3 py-2 border-b border-border-default bg-bg-input text-text-primary font-table text-table outline-none"
          />
          <ul id={listId} role="listbox" className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-text-muted font-table text-table">No units match</li>
            )}
            {filtered.map((u) => (
              <li key={u} role="option" aria-selected={u === value}>
                <button
                  type="button"
                  onClick={() => select(u)}
                  className={cn(
                    "w-full text-left px-3 py-2 font-table text-table hover:bg-bg-hover transition-colors",
                    u === value ? "bg-accent-primary/10 text-accent-primary" : "text-text-primary",
                  )}
                >
                  <span className="font-mono text-mono font-semibold">{u}</span>
                  <span className="text-text-muted ml-2 text-[11px]">
                    {labels[u].replace(/^[^—]+—\s*/, "")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
