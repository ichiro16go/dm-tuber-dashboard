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

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** 9/12 のような月日表記（JST） */
export function formatMonthDay(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** 2026/09/12 06:00 のような日時表記（JST） */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** 秒数 → 12:34 / 1:02:03 */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
