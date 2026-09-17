const compactFormatter = new Intl.NumberFormat("ja-JP", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const plainFormatter = new Intl.NumberFormat("ja-JP");

export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

export function formatNumber(value: number): string {
  return plainFormatter.format(value);
}
