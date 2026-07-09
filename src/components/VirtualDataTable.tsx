import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DataTable, type Column } from "./DataTable";

const VIRTUAL_THRESHOLD = 30;

interface VirtualDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
  maxHeight?: number;
}

/** Virtualizes body rows when data exceeds threshold; falls back to DataTable for small sets. */
export function VirtualDataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage,
  className,
  maxHeight = 480,
}: VirtualDataTableProps<T>) {
  if (data.length <= VIRTUAL_THRESHOLD) {
    return (
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        emptyMessage={emptyMessage}
        className={className}
      />
    );
  }

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 6,
  });

  return (
    <div
      className={`w-full overflow-auto border border-border-default rounded-lg bg-bg-surface ${className ?? ""}`}
      ref={parentRef}
      style={{ maxHeight }}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-bg-elevated border-b border-border-default">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-3 py-2 font-label text-label text-text-secondary whitespace-nowrap border-r border-border-default last:border-r-0"
                style={col.width ? { width: col.width, minWidth: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((v) => {
            const row = data[v.index];
            const rowKey = keyExtractor(row, v.index);
            return (
              <tr
                key={rowKey}
                className={`border-b border-border-default ${v.index % 2 === 0 ? "bg-bg-surface" : "bg-bg-primary"}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: v.size,
                  transform: `translateY(${v.start}px)`,
                  display: "table",
                  tableLayout: "fixed",
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-1.5 font-table text-table text-text-primary border-r border-border-default last:border-r-0"
                  >
                    {col.render(row, v.index)}
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
