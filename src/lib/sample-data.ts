import type { ChannelWithMetrics, Video } from "./types";

// Supabase 未設定時にダッシュボードの見た目を確認できるようにするための架空のサンプルデータ。
// 実在のチャンネル・人物とは一切関係ない。

const PLACEHOLDER_ICON = "/avatar-placeholder.svg";

interface SampleSeed {
  id: string;
  title: string;
  tags: string[];
  subscriberCount: number;
  avgViewsLast30Videos: number;
  avgViewsLast30Days: number;
  last30DaysVideoCount: number;
}

const SEEDS: SampleSeed[] = [
  { id: "sample-01", title: "サンプル紙デュエマ実況A", tags: ["紙"], subscriberCount: 128000, avgViewsLast30Videos: 42000, avgViewsLast30Days: 39500, last30DaysVideoCount: 14 },
  { id: "sample-02", title: "サンプルデュエプレ配信B", tags: ["デュエプレ"], subscriberCount: 96000, avgViewsLast30Videos: 35800, avgViewsLast30Days: 31200, last30DaysVideoCount: 12 },
  { id: "sample-03", title: "サンプルVTuberチャンネルC", tags: ["VTuber", "紙"], subscriberCount: 84000, avgViewsLast30Videos: 29900, avgViewsLast30Days: 33100, last30DaysVideoCount: 9 },
  { id: "sample-04", title: "サンプルデュエマ大会実況D", tags: ["紙"], subscriberCount: 77000, avgViewsLast30Videos: 27600, avgViewsLast30Days: 25400, last30DaysVideoCount: 8 },
  { id: "sample-05", title: "サンプルデュエプレ解説E", tags: ["デュエプレ"], subscriberCount: 65000, avgViewsLast30Videos: 24100, avgViewsLast30Days: 26800, last30DaysVideoCount: 16 },
  { id: "sample-06", title: "サンプルVTuberデュエプレF", tags: ["VTuber", "デュエプレ"], subscriberCount: 61000, avgViewsLast30Videos: 22300, avgViewsLast30Days: 20100, last30DaysVideoCount: 7 },
  { id: "sample-07", title: "サンプル紙デッキ紹介G", tags: ["紙"], subscriberCount: 58000, avgViewsLast30Videos: 21000, avgViewsLast30Days: 19800, last30DaysVideoCount: 10 },
  { id: "sample-08", title: "サンプルデュエプレランクマH", tags: ["デュエプレ"], subscriberCount: 52000, avgViewsLast30Videos: 18700, avgViewsLast30Days: 17900, last30DaysVideoCount: 20 },
  { id: "sample-09", title: "サンプル紙対戦動画I", tags: ["紙"], subscriberCount: 47000, avgViewsLast30Videos: 17200, avgViewsLast30Days: 15600, last30DaysVideoCount: 6 },
  { id: "sample-10", title: "サンプルVTuber雑談J", tags: ["VTuber"], subscriberCount: 44000, avgViewsLast30Videos: 15900, avgViewsLast30Days: 18200, last30DaysVideoCount: 11 },
  { id: "sample-11", title: "サンプルデュエプレ環境考察K", tags: ["デュエプレ"], subscriberCount: 39000, avgViewsLast30Videos: 14300, avgViewsLast30Days: 13100, last30DaysVideoCount: 9 },
  { id: "sample-12", title: "サンプル紙新弾レビューL", tags: ["紙"], subscriberCount: 36000, avgViewsLast30Videos: 13400, avgViewsLast30Days: 14900, last30DaysVideoCount: 5 },
  { id: "sample-13", title: "サンプルVTuber紙実況M", tags: ["VTuber", "紙"], subscriberCount: 33000, avgViewsLast30Videos: 12100, avgViewsLast30Days: 11500, last30DaysVideoCount: 8 },
  { id: "sample-14", title: "サンプルデュエプレ初心者向けN", tags: ["デュエプレ"], subscriberCount: 29000, avgViewsLast30Videos: 10800, avgViewsLast30Days: 12300, last30DaysVideoCount: 13 },
  { id: "sample-15", title: "サンプル紙大会同時視聴O", tags: ["紙"], subscriberCount: 26000, avgViewsLast30Videos: 9600, avgViewsLast30Days: 8900, last30DaysVideoCount: 4 },
  { id: "sample-16", title: "サンプルデュエプレ検証P", tags: ["デュエプレ"], subscriberCount: 22000, avgViewsLast30Videos: 8300, avgViewsLast30Days: 7700, last30DaysVideoCount: 10 },
  { id: "sample-17", title: "サンプルVTuberデュエマ雑談Q", tags: ["VTuber"], subscriberCount: 19000, avgViewsLast30Videos: 7100, avgViewsLast30Days: 7900, last30DaysVideoCount: 6 },
  { id: "sample-18", title: "サンプル紙デッキ構築R", tags: ["紙"], subscriberCount: 15000, avgViewsLast30Videos: 5800, avgViewsLast30Days: 5300, last30DaysVideoCount: 7 },
  { id: "sample-19", title: "サンプルデュエプレ実況S", tags: ["デュエプレ"], subscriberCount: 11000, avgViewsLast30Videos: 4600, avgViewsLast30Days: 4100, last30DaysVideoCount: 5 },
  { id: "sample-20", title: "サンプル紙初心者講座T", tags: ["紙"], subscriberCount: 9000, avgViewsLast30Videos: 3900, avgViewsLast30Days: 4400, last30DaysVideoCount: 9 },
  { id: "sample-21", title: "サンプルVTuberデュエプレU", tags: ["VTuber", "デュエプレ"], subscriberCount: 6500, avgViewsLast30Videos: 2800, avgViewsLast30Days: 2500, last30DaysVideoCount: 3 },
  { id: "sample-22", title: "サンプル紙対戦記録V", tags: ["紙"], subscriberCount: 4200, avgViewsLast30Videos: 1900, avgViewsLast30Days: 2100, last30DaysVideoCount: 4 },
  { id: "sample-23", title: "サンプルデュエプレ小規模W", tags: ["デュエプレ"], subscriberCount: 2600, avgViewsLast30Videos: 1200, avgViewsLast30Days: 1400, last30DaysVideoCount: 6 },
  { id: "sample-24", title: "サンプル紙新人チャンネルX", tags: ["紙"], subscriberCount: 1300, avgViewsLast30Videos: 680, avgViewsLast30Days: 720, last30DaysVideoCount: 2 },
];

export function getSampleChannels(): ChannelWithMetrics[] {
  const updatedAt = new Date().toISOString();
  return SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    thumbnailUrl: PLACEHOLDER_ICON,
    subscriberCount: seed.subscriberCount,
    tags: seed.tags,
    isActive: true,
    metrics: {
      channelId: seed.id,
      avgViewsLast30Videos: seed.avgViewsLast30Videos,
      avgViewsLast30Days: seed.avgViewsLast30Days,
      last30DaysVideoCount: seed.last30DaysVideoCount,
      updatedAt,
    },
  }));
}

const DAY_MS = 24 * 60 * 60 * 1000;

// チャンネルIDから決まる疑似乱数（同じチャンネルなら毎回同じ動画一覧になる）
function seededRandom(seedText: string): () => number {
  let state = 0;
  for (const ch of seedText) state = (state * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 詳細画面用の架空の直近30日の動画一覧（投稿日時の降順）。
 * 通常動画の本数・平均再生数は、そのチャンネルの metrics と一致するように作る。
 */
export function getSampleVideos(channelId: string, now: number = Date.now()): Video[] {
  const seed = SEEDS.find((s) => s.id === channelId);
  if (!seed) return [];
  const random = seededRandom(channelId);

  const normalCount = seed.last30DaysVideoCount;
  const weights = Array.from({ length: normalCount }, () => 0.4 + random() * 1.4);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const targetTotal = seed.avgViewsLast30Days * normalCount;
  const views = weights.map((w) => Math.round((w / weightSum) * targetTotal));
  views[views.length - 1] += targetTotal - views.reduce((a, b) => a + b, 0);

  const videos: Video[] = [];
  const publishedAt = (index: number, count: number) =>
    new Date(now - ((index + random() * 0.8) / count) * 29 * DAY_MS - DAY_MS / 4).toISOString();

  views.forEach((viewCount, i) => {
    videos.push({
      id: `${channelId}-v${i + 1}`,
      channelId,
      title: `【サンプル】通常動画 #${normalCount - i}`,
      publishedAt: publishedAt(i, normalCount),
      viewCount,
      duration: 480 + Math.round(random() * 1200),
      isShort: false,
      isLiveArchive: false,
    });
  });

  const shortCount = Math.round(normalCount * 0.6);
  for (let i = 0; i < shortCount; i++) {
    videos.push({
      id: `${channelId}-s${i + 1}`,
      channelId,
      title: `【サンプル】ショート #${shortCount - i}`,
      publishedAt: publishedAt(i, shortCount),
      viewCount: Math.round(seed.avgViewsLast30Days * (0.3 + random() * 1.5)),
      duration: 20 + Math.round(random() * 40),
      isShort: true,
      isLiveArchive: false,
    });
  }

  const liveCount = 1 + Math.floor(random() * 2);
  for (let i = 0; i < liveCount; i++) {
    videos.push({
      id: `${channelId}-l${i + 1}`,
      channelId,
      title: `【サンプル】配信アーカイブ #${liveCount - i}`,
      publishedAt: publishedAt(i, liveCount),
      viewCount: Math.round(seed.avgViewsLast30Days * (0.2 + random() * 0.4)),
      duration: 3600 + Math.round(random() * 3600),
      isShort: false,
      isLiveArchive: true,
    });
  }

  return videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
