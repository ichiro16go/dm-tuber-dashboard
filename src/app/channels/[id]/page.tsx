import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChannelDetail } from "@/lib/data";
import { formatCompactNumber, formatDateTime, formatDuration, formatMonthDay, formatNumber } from "@/lib/format";
import type { Video } from "@/lib/types";
import { ChannelAvatar, SampleNotice, TagChips } from "@/components/ChannelParts";
import ViewsChart from "@/components/ViewsChart";

// 一覧と同じ鮮度（AGENTS.md 3.3）。チャンネルページは初回アクセス時に生成し、以後ISRで更新する。
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/channels/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { detail } = await getChannelDetail(decodeURIComponent(id));
  if (!detail) return { title: "チャンネルが見つかりません | デュエマYouTuberダッシュボード" };
  return {
    title: `${detail.channel.title} | デュエマYouTuberダッシュボード`,
    description: `${detail.channel.title} の直近30日の通常動画の再生数と投稿内訳`,
  };
}

type VideoKind = { label: string; counted: boolean; className: string };

function videoKind(video: Video): VideoKind {
  if (video.isLiveArchive) return { label: "配信", counted: false, className: "bg-chip text-muted" };
  if (video.isShort) return { label: "ショート", counted: false, className: "bg-chip text-muted" };
  return { label: "通常", counted: true, className: "bg-accent/15 text-accent" };
}

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6" />
      <path d="M10 14L20 4" />
      <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export default async function ChannelPage({ params }: PageProps<"/channels/[id]">) {
  const { id } = await params;
  const { detail, isSample } = await getChannelDetail(decodeURIComponent(id));
  if (!detail) notFound();

  const { channel, rank, totalChannels, recentVideos, videosUnavailable } = detail;
  const average = channel.metrics?.avgViewsLast30Days ?? 0;
  const normalVideos = recentVideos.filter((v) => !v.isShort && !v.isLiveArchive);
  const shortCount = recentVideos.filter((v) => v.isShort).length;
  const liveCount = recentVideos.filter((v) => v.isLiveArchive).length;
  // サンプルのIDは架空なので、YouTubeへのリンクは実データのときだけ出す
  const youtubeUrl = isSample ? null : `https://www.youtube.com/channel/${channel.id}`;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-4 pt-6 pb-12 md:gap-7 md:px-16 md:pt-10 md:pb-16">
      <Link href="/" className="flex h-11 w-fit items-center gap-1.5 text-sm text-muted hover:text-ink">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        ランキングに戻る
      </Link>

      {isSample && <SampleNotice />}

      <header className="flex flex-col gap-5 border-b border-line-strong pb-6 md:flex-row md:items-center md:justify-between md:pb-8">
        <div className="flex items-center gap-4 md:gap-6">
          <ChannelAvatar src={channel.thumbnailUrl} size={72} />
          <div className="flex min-w-0 flex-col gap-2">
            <div className="font-mono text-[11px] font-semibold tracking-[0.14em] text-accent md:text-[13px]">
              直近30日平均 {rank}位 / {totalChannels}
            </div>
            <h1 className="font-display text-2xl leading-tight md:text-[40px]">{channel.title}</h1>
            <TagChips tags={channel.tags} size="md" />
          </div>
        </div>
        {youtubeUrl && (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-fit shrink-0 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-track"
          >
            YouTubeで見る
            <ExternalIcon />
          </a>
        )}
      </header>

      <section aria-label="主要指標" className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-4">
        <div className="col-span-2 flex flex-col gap-1.5 rounded-[14px] border border-accent bg-surface-raised p-5 md:col-span-1 md:p-6">
          <div className="text-sm text-muted">直近30日平均再生数</div>
          <div className="font-mono text-[40px] font-semibold leading-tight md:text-5xl" title={`${formatNumber(average)} 回`}>
            {formatCompactNumber(average)}
          </div>
          <div className="text-xs text-faint">過去30日に投稿された通常動画 {channel.metrics?.last30DaysVideoCount ?? 0}本の平均</div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-5 md:p-6">
          <div className="text-sm text-muted">30日投稿数</div>
          <div className="font-mono text-[28px] font-semibold leading-tight md:text-[32px]">
            {channel.metrics?.last30DaysVideoCount ?? 0}
            <span className="ml-1 text-base font-medium text-muted">本</span>
          </div>
          <div className="text-xs text-faint">通常動画のみ</div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-5 md:p-6">
          <div className="text-sm text-muted">登録者数</div>
          <div className="font-mono text-[28px] font-semibold leading-tight md:text-[32px]" title={`${formatNumber(channel.subscriberCount)} 人`}>
            {formatCompactNumber(channel.subscriberCount)}
          </div>
        </div>
      </section>

      <section aria-labelledby="chart-heading" className="flex flex-col gap-5 rounded-[14px] border border-line bg-panel p-5 md:p-6">
        <div className="flex flex-col gap-1">
          <h2 id="chart-heading" className="text-base font-bold">通常動画ごとの再生数</h2>
          <p className="text-[13px] text-muted">
            直近30日の通常動画を投稿順に並べています。点線がこのチャンネルの直近30日平均です。
          </p>
        </div>
        {videosUnavailable ? (
          <p className="py-10 text-center text-sm text-faint">動画データを取得できませんでした。時間をおいて再度お試しください。</p>
        ) : (
          <ViewsChart videos={normalVideos} average={average} />
        )}
      </section>

      <section aria-labelledby="videos-heading" className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-panel">
        <div className="flex flex-col gap-3 border-b border-line bg-panel-head px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <h2 id="videos-heading" className="text-base font-bold">直近30日の投稿</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent">通常 {normalVideos.length}本（集計対象）</span>
            <span className="rounded-full bg-chip px-2.5 py-1 text-muted">ショート {shortCount}本</span>
            <span className="rounded-full bg-chip px-2.5 py-1 text-muted">配信 {liveCount}本</span>
          </div>
        </div>

        {videosUnavailable && (
          <p className="px-6 py-10 text-center text-sm text-faint">動画データを取得できませんでした。</p>
        )}
        {!videosUnavailable && recentVideos.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-faint">直近30日の投稿はありません。</p>
        )}

        <ul>
          {recentVideos.map((video) => {
            const kind = videoKind(video);
            const videoUrl = isSample ? null : `https://www.youtube.com/watch?v=${video.id}`;
            return (
              <li key={video.id} className="relative flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0 hover:bg-row-hover md:gap-4 md:px-6">
                {isSample ? (
                  <div aria-hidden="true" className="h-[45px] w-20 shrink-0 rounded-md bg-track md:h-[54px] md:w-24" />
                ) : (
                  <Image
                    src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
                    alt=""
                    width={96}
                    height={54}
                    className="h-[45px] w-20 shrink-0 rounded-md bg-track object-cover md:h-[54px] md:w-24"
                    unoptimized
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {videoUrl ? (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`line-clamp-2 text-sm font-medium after:absolute after:inset-0 ${kind.counted ? "text-ink" : "text-muted"} hover:underline`}
                    >
                      {video.title || "（タイトル未取得）"}
                    </a>
                  ) : (
                    <span className={`line-clamp-2 text-sm font-medium ${kind.counted ? "text-ink" : "text-muted"}`}>{video.title}</span>
                  )}
                  <div className="flex items-center gap-2 text-xs text-faint">
                    <span className={`rounded px-1.5 py-px text-[11px] font-medium ${kind.className}`}>{kind.label}</span>
                    <span>{formatMonthDay(video.publishedAt)}</span>
                    <span className="font-mono">{formatDuration(video.duration)}</span>
                    {!kind.counted && <span>集計対象外</span>}
                  </div>
                </div>
                <div
                  className={`shrink-0 text-right font-mono text-sm md:text-base ${kind.counted ? "font-semibold text-ink" : "text-faint"}`}
                  title={`${formatNumber(video.viewCount)} 回`}
                >
                  {formatCompactNumber(video.viewCount)}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-xs leading-relaxed text-faint">
        {channel.metrics && <>最終集計 {formatDateTime(channel.metrics.updatedAt)} (JST)。</>}
        180秒以下の動画はショート、生配信の履歴がある動画は配信として集計から除外しています。
      </p>
    </main>
  );
}
