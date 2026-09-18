import { formatCompactNumber, formatMonthDay, formatNumber } from "@/lib/format";
import type { Video } from "@/lib/types";

const CHART_HEIGHT = 220;

// 目盛りの上限を 1 / 2 / 2.5 / 5 × 10^n の切りのいい値に丸める
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

/**
 * 直近30日の通常動画ごとの再生数（投稿順・古い→新しい）と、平均値の基準線。
 * ホバー/フォーカスで動画ごとの値を出す。数値の一覧は下の動画リストが兼ねる。
 */
export default function ViewsChart({ videos, average }: { videos: Video[]; average: number }) {
  const ordered = [...videos].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const max = niceCeil(Math.max(average, ...ordered.map((v) => v.viewCount)));
  const ticks = [max, max / 2, 0];
  const averageBottom = (average / max) * CHART_HEIGHT;

  if (ordered.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-line-strong text-sm text-faint">
        直近30日に投稿された通常動画はありません。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        {/* y軸 */}
        <div className="relative w-12 shrink-0 text-right font-mono text-[11px] text-faint" style={{ height: CHART_HEIGHT }} aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 translate-y-1/2" style={{ bottom: (tick / max) * CHART_HEIGHT }}>
              {formatCompactNumber(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1" style={{ height: CHART_HEIGHT }}>
          {/* グリッド（控えめ） */}
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden="true"
              className={`absolute inset-x-0 border-t ${tick === 0 ? "border-line-strong" : "border-line-soft"}`}
              style={{ bottom: (tick / max) * CHART_HEIGHT }}
            />
          ))}

          <ol aria-label="通常動画ごとの再生数" className="absolute inset-0 flex items-end gap-0.5">
            {ordered.map((video, index) => {
              const align =
                index < ordered.length / 3 ? "left-0" : index > (ordered.length * 2) / 3 ? "right-0" : "left-1/2 -translate-x-1/2";
              return (
                <li
                  key={video.id}
                  tabIndex={0}
                  aria-label={`${formatMonthDay(video.publishedAt)} ${video.title} ${formatNumber(video.viewCount)}回`}
                  className="group relative flex h-full min-w-0 flex-1 items-end outline-none"
                >
                  <div
                    className="w-full rounded-t-[4px] bg-chart transition group-hover:brightness-125 group-focus-visible:brightness-125"
                    style={{ height: Math.max(2, (video.viewCount / max) * CHART_HEIGHT) }}
                  />
                  <div
                    role="presentation"
                    className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden w-56 rounded-lg border border-line-strong bg-panel-head px-3 py-2 text-xs shadow-lg group-hover:block group-focus-visible:block ${align}`}
                  >
                    <div className="text-faint">{formatMonthDay(video.publishedAt)}</div>
                    <div className="line-clamp-2 text-ink">{video.title}</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-ink">{formatNumber(video.viewCount)} 回</div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* 平均の基準線 */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-soft" style={{ bottom: averageBottom }}>
            <span className="absolute right-0 bottom-1 rounded bg-panel px-1.5 font-mono text-[11px] text-ink-soft">
              平均 {formatCompactNumber(average)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between pl-[60px] text-[11px] text-faint">
        <span>{formatMonthDay(ordered[0].publishedAt)}</span>
        <span>投稿順 →</span>
        <span>{formatMonthDay(ordered[ordered.length - 1].publishedAt)}</span>
      </div>
    </div>
  );
}
