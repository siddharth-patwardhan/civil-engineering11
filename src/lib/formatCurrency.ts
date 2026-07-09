/** Canonical INR formatting — use across all pages. */
export function formatInr(n: number, opts?: { maxFractionDigits?: number }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts?.maxFractionDigits ?? 2,
  }).format(n);
}

export function formatInrCompact(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)} L`;
  return formatInr(n, { maxFractionDigits: 0 });
}
