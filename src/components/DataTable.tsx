import { useState, useCallback } from "react";
import { cn } from "../lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export interface Column<T> {
  key: string;
  header: string;
  width?: string | number;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => import("react").ReactNode;
  editable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  rowHeight?: number;
  onRowClick?: (row: T, index: number) => void;
  selectedRow?: string | null;
  emptyMessage?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  DataTable Component                                               */
/* ------------------------------------------------------------------ */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  rowHeight = 40,
  onRowClick,
  selectedRow,
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleRowClick = useCallback(
    (row: T, index: number) => {
      onRowClick?.(row, index);
    },
    [onRowClick]
  );

  return (
    <div className={cn("w-full overflow-auto touch-scroll table-scroll-hint border border-border-default rounded-lg bg-bg-surface", className)}>
      <table className="w-full border-collapse" style={{ minWidth: columns.reduce((sum, c) => sum + (typeof c.width === "number" ? c.width : 80), 0) }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-bg-elevated border-b border-border-default">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "px-3 py-2 font-label text-label text-text-secondary whitespace-nowrap border-r border-border-default last:border-r-0",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center"
                )}
                style={col.width ? { width: col.width, minWidth: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-12 text-center text-text-muted font-body text-body">
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((row, index) => {
            const rowKey = keyExtractor(row, index);
            const isSelected = selectedRow === rowKey;
            const isHovered = hoveredRow === rowKey;

            return (
              <tr
                key={rowKey}
                onClick={() => handleRowClick(row, index)}
                onMouseEnter={() => setHoveredRow(rowKey)}
                onMouseLeave={() => setHoveredRow(null)}
                className={cn(
                  "border-b border-border-default transition-colors cursor-pointer",
                  index % 2 === 0 ? "bg-bg-surface" : "bg-bg-primary",
                  isHovered && "bg-bg-hover",
                  isSelected && "bg-accent-primary-glow"
                )}
                style={{ height: rowHeight }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-3 py-1.5 font-table text-table text-text-primary border-r border-border-default last:border-r-0",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
