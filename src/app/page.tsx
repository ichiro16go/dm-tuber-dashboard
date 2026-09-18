import { getChannelsWithMetrics } from "@/lib/data";
import ChannelDashboard from "@/components/ChannelDashboard";

// バッチ取り込みでDBが更新されるため、数分単位で再取得する（毎リクエストDBを叩かないためのISR）。
export const revalidate = 300;

export default async function Home() {
  const { channels, isSample } = await getChannelsWithMetrics();

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 pt-7 pb-10 md:gap-7 md:px-16 md:pt-12 md:pb-16">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-12 md:border-b md:border-line-strong md:pb-7">
        <div className="flex flex-col gap-2.5 md:gap-3">
          <div className="font-mono text-[11px] font-semibold tracking-[0.14em] text-accent md:text-[13px]">
            DUEL MASTERS × YOUTUBE
          </div>
          <h1 className="font-display text-[28px] leading-tight tracking-[0.02em] md:text-[46px]">
            デュエマYouTuberランキング
          </h1>
          <p className="text-sm leading-relaxed text-muted md:text-base">
            ショート・生配信を除いた「通常動画」の再生数で、チャンネルの実力を横並びで比較します。
          </p>
        </div>
        <dl className="flex gap-6 md:gap-10">
          <div className="flex flex-col gap-1.5">
            <dt className="text-xs text-faint">掲載チャンネル</dt>
            <dd className="font-mono text-xl font-semibold md:text-[28px]">{channels.length}</dd>
          </div>
          <div className="flex flex-col gap-1.5">
            {/* .github/workflows/fetch-data.yml の cron (21:00 UTC) に合わせている */}
            <dt className="text-xs text-faint">データ更新</dt>
            <dd className="text-sm font-medium leading-7 md:text-base md:leading-[34px]">毎日 6:00 (JST)</dd>
          </div>
        </dl>
      </header>

      <ChannelDashboard channels={channels} isSample={isSample} />
    </main>
  );
}
