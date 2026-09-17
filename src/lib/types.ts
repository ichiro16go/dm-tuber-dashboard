// タグ区分（カテゴリフィルタ用）
export const TAG_OPTIONS = ["デュエプレ", "紙", "VTuber", "ゆっくり"] as const;
export type Tag = (typeof TAG_OPTIONS)[number];

export const ALL_TAG = "ALL" as const;

// チャンネル情報
export interface Channel {
  id: string; // YouTube Channel ID
  title: string; // チャンネル名
  thumbnailUrl: string; // アイコンURL
  subscriberCount: number; // 登録者数
  tags: string[]; // ["デュエプレ", "紙", "VTuber"] など
  isActive: boolean; // 直近30日投稿有無
}

// 動画情報（集計元データ）
export interface Video {
  id: string; // YouTube Video ID
  channelId: string;
  publishedAt: string; // 投稿日時 (ISO8601)
  viewCount: number; // 再生回数
  duration: number; // 秒数
  isShort: boolean; // ショート判定フラグ
  isLiveArchive: boolean; // ライブ配信フラグ
}

// 集計結果（表示用キャッシュ）
export interface ChannelMetrics {
  channelId: string;
  avgViewsLast30Videos: number; // 直近30本平均
  avgViewsLast30Days: number; // 直近30日平均
  last30DaysVideoCount: number; // 直近30日投稿本数
  updatedAt: string;
}

// ダッシュボード表示用の結合済みレコード
export interface ChannelWithMetrics extends Channel {
  metrics: ChannelMetrics | null;
}

export type SortMetric = "avgViewsLast30Videos" | "avgViewsLast30Days" | "subscriberCount";

export type SortOrder = "desc" | "asc";
