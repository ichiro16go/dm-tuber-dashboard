import { getChannelsWithMetrics } from "@/lib/data";
import ChannelDashboard from "@/components/ChannelDashboard";

// バッチ取り込みでDBが更新されるため、数分単位で再取得する（毎リクエストDBを叩かないためのISR）。
export const revalidate = 300;

export default async function Home() {
  const { channels, isSample } = await getChannelsWithMetrics();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-white">デュエマYouTuberダッシュボード</h1>
        <p className="text-sm text-slate-400">
          ショート動画・生配信を除いた通常動画のパフォーマンスでチャンネルを比較できます。
        </p>
      </header>

      <ChannelDashboard channels={channels} isSample={isSample} />
    </main>
  );
}
