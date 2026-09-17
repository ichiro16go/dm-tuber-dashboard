"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ALL_TAG, TAG_OPTIONS, type ChannelWithMetrics, type SortMetric, type SortOrder } from "@/lib/types";
import { formatCompactNumber, formatNumber } from "@/lib/format";

const SORT_METRIC_LABELS: Record<SortMetric, string> = {
  avgViewsLast30Videos: "直近30本平均再生数",
  avgViewsLast30Days: "直近30日平均再生数",
  subscriberCount: "登録者数",
};

const TOP_N = 20;

function metricValue(channel: ChannelWithMetrics, metric: SortMetric): number {
  if (metric === "subscriberCount") return channel.subscriberCount;
  if (!channel.metrics) return 0;
  return channel.metrics[metric];
}

export default function ChannelDashboard({
  channels,
  isSample,
}: {
  channels: ChannelWithMetrics[];
  isSample: boolean;
}) {
  const [tag, setTag] = useState<string>(ALL_TAG);
  const [sortMetric, setSortMetric] = useState<SortMetric>("avgViewsLast30Videos");
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

  const visible = showAll ? filtered : filtered.slice(0, TOP_N);

  return (
    <div className="flex flex-col gap-6">
      {isSample && (
        <div className="rounded-md border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          Supabase が未設定のため、サンプルデータを表示しています。実データを表示するには環境変数を設定し、バッチ取り込みを実行してください。
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[ALL_TAG, ...TAG_OPTIONS].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTag(option)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tag === option
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {option === ALL_TAG ? "すべて" : option}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            ソート指標
            <select
              value={sortMetric}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
            >
              {(Object.keys(SORT_METRIC_LABELS) as SortMetric[]).map((metric) => (
                <option key={metric} value={metric}>
                  {SORT_METRIC_LABELS[metric]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            {sortOrder === "desc" ? "降順 ↓" : "昇順 ↑"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/70 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">順位</th>
              <th className="px-4 py-3 font-medium">チャンネル</th>
              <th className="px-4 py-3 font-medium">タグ</th>
              <th className="px-4 py-3 text-right font-medium">直近30本平均</th>
              <th className="px-4 py-3 text-right font-medium">直近30日平均</th>
              <th className="px-4 py-3 text-right font-medium">直近30日投稿数</th>
              <th className="px-4 py-3 text-right font-medium">登録者数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {visible.map((channel, index) => (
              <tr key={channel.id} className="hover:bg-slate-900/50">
                <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={channel.thumbnailUrl}
                      alt={channel.title}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full bg-slate-800 object-cover"
                      unoptimized
                    />
                    <span className="font-medium text-slate-100">{channel.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {channel.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td
                  className="px-4 py-3 text-right text-slate-100"
                  title={`${formatNumber(channel.metrics?.avgViewsLast30Videos ?? 0)} 回`}
                >
                  {formatCompactNumber(channel.metrics?.avgViewsLast30Videos ?? 0)}
                </td>
                <td
                  className="px-4 py-3 text-right text-slate-100"
                  title={`${formatNumber(channel.metrics?.avgViewsLast30Days ?? 0)} 回`}
                >
                  {formatCompactNumber(channel.metrics?.avgViewsLast30Days ?? 0)}
                </td>
                <td className="px-4 py-3 text-right text-slate-300">
                  {channel.metrics?.last30DaysVideoCount ?? 0}
                </td>
                <td
                  className="px-4 py-3 text-right text-slate-100"
                  title={`${formatNumber(channel.subscriberCount)} 人`}
                >
                  {formatCompactNumber(channel.subscriberCount)}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  該当するチャンネルがありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > TOP_N && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            {showAll ? `トップ${TOP_N}のみ表示` : `すべて見る（${filtered.length}件）`}
          </button>
        </div>
      )}
    </div>
  );
}
