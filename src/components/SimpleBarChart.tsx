interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export function SimpleBarChart({ data, height = 200 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const colors = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626"];

  return (
    <div className="flex items-end gap-3 w-full" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="w-full flex items-end justify-center" style={{ height: height - 48 }}>
              <div
                className="w-full max-w-[48px] rounded-t-md transition-all"
                style={{
                  height: `${Math.max(pct, 4)}%`,
                  backgroundColor: d.color ?? colors[i % colors.length],
                }}
                title={`${d.label}: ${d.value.toLocaleString("en-IN")}`}
              />
            </div>
            <span className="font-label text-label text-text-muted text-center truncate w-full text-[10px]">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
