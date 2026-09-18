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
  title: string; // 動画タイトル
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

// 直近30本平均はDBには保持しているが、ダッシュボードの表示・ソート対象からは外している（AGENTS.md 3.6）。
export type SortMetric = "avgViewsLast30Days" | "last30DaysVideoCount" | "subscriberCount";

export type SortOrder = "desc" | "asc";

// チャンネル詳細画面用
export interface ChannelDetail {
  channel: ChannelWithMetrics;
  rank: number; // 直近30日平均での全体順位（1始まり）
  totalChannels: number;
  recentVideos: Video[]; // 直近30日の全動画（ショート・生配信含む）。投稿日時の降順
  videosUnavailable: boolean; // 動画一覧の取得に失敗した場合 true
}
