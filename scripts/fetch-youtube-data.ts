import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fetchChannels, fetchRecentVideoIds, fetchVideos } from "./lib/youtube";
import { parseIso8601Duration } from "./lib/duration";
import { computeMetrics, hasRecentActivity, SHORTS_MAX_DURATION_SECONDS } from "./lib/metrics";
import { getSupabaseAdminClient } from "../src/lib/supabase";
import type { Video } from "../src/lib/types";

const MIN_SUBSCRIBER_COUNT = 1000;

interface CandidateChannel {
  id: string;
  tags: string[];
}

function loadCandidates(): CandidateChannel[] {
  const configPath = path.resolve(process.cwd(), "config/channel-candidates.json");
  const raw = JSON.parse(readFileSync(configPath, "utf-8")) as Array<{ id: string; tags?: string[] }>;
  return raw.map((c) => ({ id: c.id, tags: c.tags ?? [] }));
}

async function processCandidate(
  candidate: CandidateChannel,
  channelResources: Awaited<ReturnType<typeof fetchChannels>>,
  apiKey: string,
  supabase: ReturnType<typeof getSupabaseAdminClient>
) {
  const resource = channelResources.get(candidate.id);
  if (!resource) {
    console.warn(`[skip] channel not found: ${candidate.id}`);
    return;
  }

  const subscriberCount = resource.statistics?.hiddenSubscriberCount
    ? 0
    : Number(resource.statistics?.subscriberCount ?? 0);
  const uploadsPlaylistId = resource.contentDetails?.relatedPlaylists?.uploads;
  const title = resource.snippet?.title ?? candidate.id;
  const thumbnailUrl =
    resource.snippet?.thumbnails?.medium?.url ?? resource.snippet?.thumbnails?.default?.url ?? "";

  if (!uploadsPlaylistId) {
    console.warn(`[skip] no uploads playlist: ${candidate.id}`);
    return;
  }

  const videoIds = await fetchRecentVideoIds(uploadsPlaylistId, apiKey);
  const videoResources = await fetchVideos(videoIds, apiKey);

  const videos: Video[] = [];
  for (const videoId of videoIds) {
    const v = videoResources.get(videoId);
    if (!v || !v.snippet?.publishedAt) continue;

    const duration = parseIso8601Duration(v.contentDetails?.duration ?? "PT0S");
    const isLiveArchive = Boolean(v.liveStreamingDetails);
    const isShort = !isLiveArchive && duration > 0 && duration <= SHORTS_MAX_DURATION_SECONDS;

    videos.push({
      id: videoId,
      channelId: candidate.id,
      publishedAt: v.snippet.publishedAt,
      viewCount: Number(v.statistics?.viewCount ?? 0),
      duration,
      isShort,
      isLiveArchive,
    });
  }

  const isActive = hasRecentActivity(videos);
  const admitted = subscriberCount >= MIN_SUBSCRIBER_COUNT && isActive;

  const normalVideos = videos.filter((v) => !v.isShort && !v.isLiveArchive);
  const metrics = computeMetrics(normalVideos);

  console.log(
    `${admitted ? "[admit]" : "[reject]"} ${title} (${candidate.id}) subs=${subscriberCount} active=${isActive} normalVideos=${normalVideos.length}`
  );

  const { error: channelError } = await supabase.from("channels").upsert({
    id: candidate.id,
    title,
    thumbnail_url: thumbnailUrl,
    subscriber_count: subscriberCount,
    tags: candidate.tags,
    is_active: admitted,
    updated_at: new Date().toISOString(),
  });
  if (channelError) {
    console.error(`  failed to upsert channel ${candidate.id}:`, channelError.message);
    return;
  }

  if (videos.length > 0) {
    const { error: videosError } = await supabase.from("videos").upsert(
      videos.map((v) => ({
        id: v.id,
        channel_id: v.channelId,
        published_at: v.publishedAt,
        view_count: v.viewCount,
        duration: v.duration,
        is_short: v.isShort,
        is_live_archive: v.isLiveArchive,
      }))
    );
    if (videosError) {
      console.error(`  failed to upsert videos for ${candidate.id}:`, videosError.message);
    }
  }

  const { error: metricsError } = await supabase.from("channel_metrics").upsert({
    channel_id: candidate.id,
    avg_views_last_30_videos: metrics.avgViewsLast30Videos,
    avg_views_last_30_days: metrics.avgViewsLast30Days,
    last_30_days_video_count: metrics.last30DaysVideoCount,
    updated_at: new Date().toISOString(),
  });
  if (metricsError) {
    console.error(`  failed to upsert metrics for ${candidate.id}:`, metricsError.message);
  }
}

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is required");

  const candidates = loadCandidates();
  if (candidates.length === 0) {
    console.warn(
      "config/channel-candidates.json is empty. Nothing to fetch. See config/channel-candidates.example.json for the format."
    );
    return;
  }

  const supabase = getSupabaseAdminClient();
  const channelResources = await fetchChannels(
    candidates.map((c) => c.id),
    apiKey
  );

  for (const candidate of candidates) {
    try {
      await processCandidate(candidate, channelResources, apiKey, supabase);
    } catch (err) {
      console.error(`[error] ${candidate.id}:`, err);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
