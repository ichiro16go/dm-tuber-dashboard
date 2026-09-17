import { getSampleChannels } from "./sample-data";
import { getSupabaseClient } from "./supabase";
import type { ChannelWithMetrics } from "./types";

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

interface ChannelMetricsRow {
  channel_id: string;
  avg_views_last_30_videos: number | string;
  avg_views_last_30_days: number | string;
  last_30_days_video_count: number;
  updated_at: string;
}

// 掲載基準（登録者数1,000人以上・直近30日以内の投稿あり）を満たすチャンネルのみを取得する。
export async function getChannelsWithMetrics(): Promise<ChannelDataResult> {
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
}
