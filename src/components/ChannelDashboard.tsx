"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL_TAG, TAG_OPTIONS, type ChannelWithMetrics, type SortMetric, type SortOrder } from "@/lib/types";
import { formatCompactNumber, formatNumber } from "@/lib/format";
import { ChannelAvatar, SampleNotice, TagChips } from "@/components/ChannelParts";

type MetricDef = { key: SortMetric; label: string; unit: string; format: (value: number) => string };

const METRICS: MetricDef[] = [
  { key: "avgViewsLast30Days", label: "直近30日平均", unit: "回", format: formatCompactNumber },
  { key: "last30DaysVideoCount", label: "30日投稿数", unit: "本", format: (v) => `${v}本` },
  { key: "subscriberCount", label: "登録者数", unit: "人", format: formatCompactNumber },
];

const TOP_N = 20;
const PODIUM_N = 3;

// デスクトップ表の列幅（ヘッダーと行で共有）
const TABLE_COLUMNS =
  "grid grid-cols-[64px_minmax(0,1fr)_340px_140px_140px] items-center gap-4 px-6";

function metricValue(channel: ChannelWithMetrics, metric: SortMetric): number {
  if (metric === "subscriberCount") return channel.subscriberCount;
  if (!channel.metrics) return 0;
  return channel.metrics[metric];
}

function rankLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function channelHref(channel: ChannelWithMetrics): string {
  return `/channels/${encodeURIComponent(channel.id)}`;
}

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4v16" />
      <path d="M3 16l4 4 4-4" />
      <path d="M17 20V4" />
      <path d="M13 8l4-4 4 4" />
    </svg>
  );
}

export default function ChannelDashboard({
  channels,
  isSample,
}: {
  channels: ChannelWithMetrics[];
  isSample: boolean;
}) {
  const [tag, setTag] = useState<string>(ALL_TAG);
  const [sortMetric, setSortMetric] = useState<SortMetric>("avgViewsLast30Days");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const byTag = tag === ALL_TAG ? channels : channels.filter((c) => c.tags.includes(tag));
    const sorted = [...byTag].sort((a, b) => {
      const diff = metricValue(a, sortMetric) - metricValue(b, sortMetric);
      return sortOrder === "desc" ? -diff : diff;
    });
    return sorted;
  }, [channels, tag, sortMetric, sortOrder]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { [ALL_TAG]: channels.length };
    for (const option of TAG_OPTIONS) {
      counts[option] = channels.filter((c) => c.tags.includes(option)).length;
    }
    return counts;
  }, [channels]);

  const visible = showAll ? filtered : filtered.slice(0, TOP_N);
  const podium = filtered.slice(0, PODIUM_N);
  const maxValue = Math.max(1, ...filtered.map((c) => metricValue(c, sortMetric)));
  const primary = METRICS.find((m) => m.key === sortMetric)!;
  const [otherA, otherB] = METRICS.filter((m) => m.key !== sortMetric);
  const orderLabel = sortOrder === "desc" ? "高い順" : "低い順";

  const selectTag = (option: string) => {
    setTag(option);
    setShowAll(false);
  };
  const toggleOrder = () => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  const barWidth = (channel: ChannelWithMetrics) =>
    `${Math.max(2, Math.round((metricValue(channel, sortMetric) / maxValue) * 100))}%`;
  const fullValue = (channel: ChannelWithMetrics, metric: MetricDef) =>
    `${formatNumber(metricValue(channel, metric.key))} ${metric.unit}`;

  return (
    <div className="flex flex-col gap-5 md:gap-7">
      {isSample && <SampleNotice />}

      <section aria-label="指標の定義" className="hidden grid-cols-3 gap-4 md:grid">
        {[
          {
            title: "直近30日平均",
            body: "過去30日以内に投稿された通常動画の平均再生数。このランキングのメイン指標です。",
          },
          {
            title: "30日投稿数",
            body: "過去30日以内に投稿された通常動画の本数。平均再生数がどれだけの本数から出ているかの目安になります。",
          },
          {
            title: "集計から除外するもの",
            body: "180秒以下の動画（ショート扱い）と生配信アーカイブ。掲載条件の「30日以内の投稿」はショートも含めて判定します。",
          },
        ].map((item) => (
          <div key={item.title} className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface px-5 py-[18px]">
            <div className="text-sm font-bold">{item.title}</div>
            <div className="text-[13px] leading-relaxed text-muted">{item.body}</div>
          </div>
        ))}
      </section>

      <section
        aria-label="絞り込みと並び替え"
        className="flex flex-col gap-3.5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-6 md:rounded-[14px] md:border md:border-line md:bg-surface md:px-5 md:py-4"
      >
        <div className="flex items-center gap-3">
          <span className="hidden text-[13px] text-faint md:inline">カテゴリ</span>
          <div className="flex flex-wrap gap-2">
            {[ALL_TAG, ...TAG_OPTIONS].map((option) => {
              const active = tag === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectTag(option)}
                  className={`flex h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition md:h-10 md:gap-2 md:px-4 ${
                    active
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line-strong bg-chip text-ink-soft hover:bg-track"
                  }`}
                >
                  {option === ALL_TAG ? "すべて" : option}
                  <span className="font-mono text-xs opacity-75">{tagCounts[option]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-stretch gap-2 md:items-center md:gap-3">
          <span className="hidden text-[13px] text-faint md:inline">並び替え</span>
          <div
            role="group"
            aria-label="並び替え指標"
            className="grid flex-1 grid-cols-3 gap-1 rounded-[10px] border border-line-strong bg-surface p-1 md:flex md:flex-none md:bg-ground"
          >
            {METRICS.map((metric) => {
              const active = sortMetric === metric.key;
              return (
                <button
                  key={metric.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSortMetric(metric.key)}
                  className={`h-11 rounded-[7px] px-1 text-xs font-medium leading-tight transition md:h-[34px] md:px-3.5 md:text-sm ${
                    active ? "bg-line-strong text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {metric.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={toggleOrder}
            aria-label={`並び順を切り替え（現在: ${orderLabel}）`}
            className="flex w-[54px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[10px] border border-line-strong bg-surface text-[11px] text-ink hover:bg-track md:h-11 md:w-auto md:flex-row md:gap-1.5 md:bg-ground md:px-3.5 md:text-sm"
          >
            <SortIcon />
            {orderLabel}
          </button>
        </div>

        <p className="text-xs leading-relaxed text-faint md:hidden">
          集計対象は過去30日の通常動画のみ。180秒以下（ショート扱い）と配信アーカイブは除外しています。
        </p>
      </section>

      {podium.length > 0 && (
        <section aria-label={`上位${PODIUM_N}チャンネル`} className="hidden grid-cols-3 gap-4 md:grid">
          {podium.map((channel, index) => (
            <article
              key={channel.id}
              className={`relative flex flex-col gap-5 rounded-[14px] border bg-surface-raised p-6 transition hover:bg-row-hover ${
                index === 0 ? "border-accent" : "border-line-strong"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 font-display text-[40px] leading-none text-accent">{rankLabel(index)}</div>
                <ChannelAvatar src={channel.thumbnailUrl} size={48} />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Link href={channelHref(channel)} className="truncate font-bold text-ink after:absolute after:inset-0 after:rounded-[14px] hover:text-ink">
                    {channel.title}
                  </Link>
                  <TagChips tags={channel.tags} size="md" />
                </div>
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-line pt-4">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-faint">{primary.label}</div>
                  <div className="font-mono text-[34px] font-semibold leading-tight" title={fullValue(channel, primary)}>
                    {primary.format(metricValue(channel, primary.key))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-[13px] text-muted">
                  {[otherA, otherB].map((metric) => (
                    <div key={metric.key}>
                      {metric.label}{" "}
                      <span className="font-mono text-ink" title={fullValue(channel, metric)}>
                        {metric.format(metricValue(channel, metric.key))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* デスクトップ: 表。行全体が詳細画面へのリンク（チャンネル名のリンクを行いっぱいに広げている） */}
      <section aria-label="ランキング" className="hidden overflow-hidden rounded-[14px] border border-line bg-panel md:block">
        <div className={`${TABLE_COLUMNS} h-12 border-b border-line bg-panel-head text-xs font-medium text-faint`}>
          <div>順位</div>
          <div>チャンネル</div>
          <div className="text-accent">
            {primary.label} {sortOrder === "desc" ? "↓" : "↑"}
          </div>
          <div className="text-right">{otherA.label}</div>
          <div className="text-right">{otherB.label}</div>
        </div>
        {visible.map((channel, index) => (
          <div key={channel.id} className={`${TABLE_COLUMNS} relative h-[60px] border-b border-line-soft text-sm hover:bg-row-hover`}>
            <div className={`font-mono text-base font-semibold ${index < PODIUM_N ? "text-accent" : "text-rank"}`}>
              {rankLabel(index)}
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <ChannelAvatar src={channel.thumbnailUrl} size={32} />
              <Link href={channelHref(channel)} className="truncate font-medium text-ink after:absolute after:inset-0 hover:text-ink">
                {channel.title}
              </Link>
              <TagChips tags={channel.tags} />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
                <div className="h-1.5 rounded-full bg-accent" style={{ width: barWidth(channel) }} />
              </div>
              <div className="w-[72px] text-right font-mono text-base font-semibold" title={fullValue(channel, primary)}>
                {primary.format(metricValue(channel, primary.key))}
              </div>
            </div>
            {[otherA, otherB].map((metric) => (
              <div key={metric.key} className="text-right font-mono text-ink-soft" title={fullValue(channel, metric)}>
                {metric.format(metricValue(channel, metric.key))}
              </div>
            ))}
          </div>
        ))}
        {visible.length === 0 && (
          <div className="px-6 py-16 text-center text-[15px] text-faint">このカテゴリに該当するチャンネルはまだありません。</div>
        )}
      </section>

      {/* モバイル: カード */}
      <ol aria-label="ランキング" className="flex flex-col gap-2 md:hidden">
        {visible.map((channel, index) => (
          <li key={channel.id} className="relative flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-3.5 active:bg-row-hover">
            <div className="flex items-center gap-2.5">
              <div className={`w-[26px] font-mono text-[15px] font-semibold ${index < PODIUM_N ? "text-accent" : "text-rank"}`}>
                {rankLabel(index)}
              </div>
              <ChannelAvatar src={channel.thumbnailUrl} size={32} />
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <Link href={channelHref(channel)} className="truncate text-sm font-bold text-ink after:absolute after:inset-0 after:rounded-xl hover:text-ink">
                  {channel.title}
                </Link>
                <TagChips tags={channel.tags} />
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[11px] text-faint">{primary.label}</div>
                <div className="font-mono text-lg font-semibold leading-tight" title={fullValue(channel, primary)}>
                  {primary.format(metricValue(channel, primary.key))}
                </div>
              </div>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-track">
              <div className="h-1 rounded-full bg-accent" style={{ width: barWidth(channel) }} />
            </div>
            <div className="flex gap-3.5 text-xs text-faint">
              {[otherA, otherB].map((metric) => (
                <span key={metric.key}>
                  {metric.label}{" "}
                  <b className="font-mono font-medium text-ink-soft">{metric.format(metricValue(channel, metric.key))}</b>
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {visible.length === 0 && (
        <div className="rounded-xl border border-line bg-surface px-4 py-12 text-center text-sm text-faint md:hidden">
          このカテゴリに該当するチャンネルはまだありません。
        </div>
      )}

      <div className="flex flex-col-reverse items-stretch gap-2.5 text-center text-xs text-faint md:flex-row md:items-center md:justify-between md:text-left md:text-[13px]">
        <span>
          {visible.length} / {filtered.length} 件を表示
          <span className="hidden md:inline">　・　チャンネルを選ぶと直近30日の動画内訳を確認できます</span>
        </span>
        {filtered.length > TOP_N && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="h-12 rounded-[10px] border border-line-strong bg-surface px-5 text-sm font-medium text-ink hover:bg-track md:h-11"
          >
            {showAll ? `トップ${TOP_N}のみ表示` : `すべて見る（${filtered.length}件）`}
          </button>
        )}
      </div>
    </div>
  );
}
