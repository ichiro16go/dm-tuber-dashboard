import type { Video } from "../../src/lib/types";

export const SHORTS_MAX_DURATION_SECONDS = Number(process.env.SHORTS_MAX_DURATION_SECONDS ?? 180);
const ACTIVE_WINDOW_DAYS = 30;
const RECENT_WINDOW_DAYS = 30;
const RECENT_VIDEO_COUNT = 30;

export function isWithinDays(iso: string, days: number, now: number = Date.now()): boolean {
  return now - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

/** 直近30日以内に1本以上の新規動画投稿があるか（動画フォーマットを問わない活動判定） */
export function hasRecentActivity(videos: Video[], now: number = Date.now()): boolean {
  return videos.some((v) => isWithinDays(v.publishedAt, ACTIVE_WINDOW_DAYS, now));
}

export interface ComputedMetrics {
  avgViewsLast30Videos: number;
  avgViewsLast30Days: number;
  last30DaysVideoCount: number;
}

/** ショート・生配信アーカイブを除いた通常動画のみを渡すこと。 */
export function computeMetrics(normalVideos: Video[], now: number = Date.now()): ComputedMetrics {
  const sorted = [...normalVideos].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const last30 = sorted.slice(0, RECENT_VIDEO_COUNT);
  const avgViewsLast30Videos = last30.length
    ? Math.round(last30.reduce((sum, v) => sum + v.viewCount, 0) / last30.length)
    : 0;

  const within30Days = sorted.filter((v) => isWithinDays(v.publishedAt, RECENT_WINDOW_DAYS, now));
  const avgViewsLast30Days = within30Days.length
    ? Math.round(within30Days.reduce((sum, v) => sum + v.viewCount, 0) / within30Days.length)
    : 0;

  return {
    avgViewsLast30Videos,
    avgViewsLast30Days,
    last30DaysVideoCount: within30Days.length,
  };
}
