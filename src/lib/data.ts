import { cache } from "react";
import { getSampleChannels, getSampleVideos } from "./sample-data";
import { getSupabaseClient } from "./supabase";
import type { ChannelDetail, ChannelWithMetrics, Video } from "./types";

export interface ChannelDataResult {
  channels: ChannelWithMetrics[];
  isSample: boolean;
}

interface ChannelRow {
  id: string;
  title: string;
  thumbnail_url: string;
  subscriber_count: number;
  tags: string[] | null;
  is_active: boolean;
}

interface VideoRow {
  id: string;
  channel_id: string;
  title: string;
  published_at: string;
  view_count: number | string;
  duration: number;
  is_short: boolean;
  is_live_archive: boolean;
}

interface ChannelMetricsRow {
  channel_id: string;
  avg_views_last_30_videos: number | string;
  avg_views_last_30_days: number | string;
  last_30_days_video_count: number;
  updated_at: string;
}

// 掲載基準（登録者数1,000人以上・直近30日以内の投稿あり）を満たすチャンネルのみを取得する。
// generateMetadata とページ本体で同じ取得を共有するため、リクエスト単位でメモ化する。
export const getChannelsWithMetrics = cache(async (): Promise<ChannelDataResult> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { channels: getSampleChannels(), isSample: true };
  }

  const [channelsResult, metricsResult] = await Promise.all([
    supabase
      .from("channels")
      .select("id, title, thumbnail_url, subscriber_count, tags, is_active")
      .eq("is_active", true)
      .gte("subscriber_count", 1000)
      .returns<ChannelRow[]>(),
    supabase.from("channel_metrics").select("*").returns<ChannelMetricsRow[]>(),
  ]);

  if (channelsResult.error || metricsResult.error || !channelsResult.data) {
    console.error(
      "Supabase からのチャンネルデータ取得に失敗したため、サンプルデータを表示します。",
      channelsResult.error ?? metricsResult.error
    );
    return { channels: getSampleChannels(), isSample: true };
  }

  const metricsByChannelId = new Map(
    (metricsResult.data ?? []).map((row) => [row.channel_id, row])
  );

  const channels: ChannelWithMetrics[] = channelsResult.data.map((row) => {
    const metricsRow = metricsByChannelId.get(row.id);
    return {
      id: row.id,
      title: row.title,
      thumbnailUrl: row.thumbnail_url || "/avatar-placeholder.svg",
      subscriberCount: row.subscriber_count,
      tags: row.tags ?? [],
      isActive: row.is_active,
      metrics: metricsRow
        ? {
            channelId: metricsRow.channel_id,
            avgViewsLast30Videos: Number(metricsRow.avg_views_last_30_videos),
            avgViewsLast30Days: Number(metricsRow.avg_views_last_30_days),
            last30DaysVideoCount: metricsRow.last_30_days_video_count,
            updatedAt: metricsRow.updated_at,
          }
        : null,
    };
  });

  return { channels, isSample: false };
});

const RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface ChannelDetailResult {
  detail: ChannelDetail | null; // 掲載中のチャンネルに該当しなければ null
  isSample: boolean;
}

/**
 * チャンネル詳細画面用。掲載基準を満たすチャンネルのみ返す（一覧と同じ母集団）。
 * 一覧がサンプルデータなら動画もサンプル、実データなら動画も実データ（混在させない）。
 */
export const getChannelDetail = cache(async (channelId: string): Promise<ChannelDetailResult> => {
  const { channels, isSample } = await getChannelsWithMetrics();
  const channel = channels.find((c) => c.id === channelId);
  if (!channel) return { detail: null, isSample };

  const days = (c: ChannelWithMetrics) => c.metrics?.avgViewsLast30Days ?? 0;
  const rank = channels.filter((c) => days(c) > days(channel)).length + 1;
  const base = { channel, rank, totalChannels: channels.length };

  // バッチ集計時点を起点に30日を切り出す（一覧の「直近30日平均」と同じ動画集合になるように）
  const anchor = channel.metrics ? new Date(channel.metrics.updatedAt).getTime() : Date.now();

  if (isSample) {
    return {
      detail: { ...base, recentVideos: getSampleVideos(channelId, anchor), videosUnavailable: false },
      isSample,
    };
  }

  const supabase = getSupabaseClient();
  const since = new Date(anchor - RECENT_WINDOW_MS).toISOString();
  const { data, error } = supabase
    ? await supabase
        .from("videos")
        .select("id, channel_id, title, published_at, view_count, duration, is_short, is_live_archive")
        .eq("channel_id", channelId)
        .gte("published_at", since)
        .order("published_at", { ascending: false })
        .returns<VideoRow[]>()
    : { data: null, error: new Error("Supabase client is not configured") };

  if (error || !data) {
    console.error(`チャンネル ${channelId} の動画一覧の取得に失敗しました。`, error);
    return { detail: { ...base, recentVideos: [], videosUnavailable: true }, isSample };
  }

  const recentVideos: Video[] = data.map((row) => ({
    id: row.id,
    channelId: row.channel_id,
    title: row.title,
    publishedAt: row.published_at,
    viewCount: Number(row.view_count),
    duration: row.duration,
    isShort: row.is_short,
    isLiveArchive: row.is_live_archive,
  }));

  return { detail: { ...base, recentVideos, videosUnavailable: false }, isSample };
});
