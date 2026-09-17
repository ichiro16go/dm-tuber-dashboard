import { getChannelsWithMetrics } from "@/lib/data";
import ChannelDashboard from "@/components/ChannelDashboard";
import { logout } from "@/app/logout/actions";

// バッチ取り込みでDBが更新されるため、数分単位で再取得する（毎リクエストDBを叩かないためのISR）。
export const revalidate = 300;

export default async function DashboardPage() {
  const { channels, isSample } = await getChannelsWithMetrics();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">デュエマYouTuberダッシュボード</h1>
          <p className="text-sm text-slate-400">
            ショート動画・生配信を除いた通常動画のパフォーマンスでチャンネルを比較できます。
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            ログアウト
          </button>
        </form>
      </header>

      <ChannelDashboard channels={channels} isSample={isSample} />
    </main>
  );
}
