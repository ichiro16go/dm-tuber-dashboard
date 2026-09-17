const API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YoutubeChannelResource {
  id: string;
  snippet?: { title?: string; thumbnails?: { default?: { url?: string }; medium?: { url?: string } } };
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

export interface YoutubePlaylistItemResource {
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
}

export interface YoutubeVideoResource {
  id: string;
  snippet?: { publishedAt?: string };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
  liveStreamingDetails?: Record<string, unknown>;
}

interface YoutubeListResponse<T> {
  items?: T[];
  nextPageToken?: string;
  error?: { message?: string };
}

async function youtubeGet<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string
): Promise<YoutubeListResponse<T>> {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", apiKey);

  const maxAttempts = 4;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url);
    if (response.ok) {
      return (await response.json()) as YoutubeListResponse<T>;
    }

    const body = await response.text();
    lastError = new Error(`YouTube API ${path} failed: ${response.status} ${body}`);

    // レート制限・一時的なサーバーエラーのみリトライする。
    if (response.status !== 403 && response.status !== 429 && response.status < 500) {
      throw lastError;
    }

    const backoffMs = 500 * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
  }

  throw lastError;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function fetchChannels(
  channelIds: string[],
  apiKey: string
): Promise<Map<string, YoutubeChannelResource>> {
  const result = new Map<string, YoutubeChannelResource>();

  for (const idsChunk of chunk(channelIds, 50)) {
    const data = await youtubeGet<YoutubeChannelResource>(
      "channels",
      { part: "snippet,statistics,contentDetails", id: idsChunk.join(",") },
      apiKey
    );
    for (const item of data.items ?? []) {
      result.set(item.id, item);
    }
  }

  return result;
}

/**
 * アップロード再生リストから最新動画IDを取得する。
 * 直近30本の通常動画と直近30日分を賄えるよう、最大 maxPages ページ（1ページ=50件）まで取得する。
 */
export async function fetchRecentVideoIds(
  uploadsPlaylistId: string,
  apiKey: string,
  { maxPages = 6 }: { maxPages?: number } = {}
): Promise<string[]> {
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const data = await youtubeGet<YoutubePlaylistItemResource>(
      "playlistItems",
      {
        part: "contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      },
      apiKey
    );

    for (const item of data.items ?? []) {
      if (item.contentDetails?.videoId) {
        videoIds.push(item.contentDetails.videoId);
      }
    }

    const oldestPublishedAt = data.items?.at(-1)?.contentDetails?.videoPublishedAt;
    const isOlderThan30Days =
      oldestPublishedAt && Date.now() - new Date(oldestPublishedAt).getTime() > 30 * 24 * 60 * 60 * 1000;
    const hasEnoughForAverage = videoIds.length >= 30;

    if (!data.nextPageToken || (isOlderThan30Days && hasEnoughForAverage)) break;
    pageToken = data.nextPageToken;
  }

  return videoIds;
}

export async function fetchVideos(
  videoIds: string[],
  apiKey: string
): Promise<Map<string, YoutubeVideoResource>> {
  const result = new Map<string, YoutubeVideoResource>();

  for (const idsChunk of chunk(videoIds, 50)) {
    const data = await youtubeGet<YoutubeVideoResource>(
      "videos",
      { part: "snippet,contentDetails,statistics,liveStreamingDetails", id: idsChunk.join(",") },
      apiKey
    );
    for (const item of data.items ?? []) {
      result.set(item.id, item);
    }
  }

  return result;
}
