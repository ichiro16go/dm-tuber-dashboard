<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# デュエマYouTuberダッシュボード — 設計ドキュメント

このファイルはこのリポジトリで作業するAIエージェント・開発者向けの設計思想の共有ドキュメント。
「何を」だけでなく「なぜそう作ったか」を書く。実装を変更する際は、まずここを読んで前提を壊していないか確認すること。

## 1. このプロダクトが解決したい問題

デュエル・マスターズ関連のYouTuberは、ショート動画や生配信アーカイブを大量投稿しているチャンネルが多く、
単純な「総再生数」や「投稿本数」ではチャンネル間のパフォーマンス比較にノイズが乗る。
このダッシュボードは **ショート・生配信を除いた「通常（横）動画」だけの再生数** を軸に、
チャンネルの実力を横並びで比較できるようにすることが唯一の目的。この軸をぶらさないこと。

## 2. データフローの全体像

```
YouTube Data API v3
      │  (scripts/fetch-youtube-data.ts を GitHub Actions が毎日実行)
      ▼
Supabase (Postgres)  channels / videos / channel_metrics
      │  (anon key・読み取り専用。RLSでSELECTのみ許可)
      ▼
Next.js Server Component (src/app/page.tsx / src/app/channels/[id]/page.tsx)
      │  getChannelsWithMetrics() / getChannelDetail() (src/lib/data.ts)
      ▼
ChannelDashboard (一覧。クライアントコンポーネント: フィルタ・ソート・Top20/全件切替)
チャンネル詳細 (サーバーコンポーネント: 指標・通常動画の再生数グラフ・直近30日の投稿一覧)
```

重要なのは **書き込みはバッチ処理のみ、アプリは常に読み取り専用** という非対称性。
Next.jsアプリ側からSupabaseへの書き込みコードは一切存在しない（存在させない）。
これによりアプリ側のセキュリティ面の考慮事項を「読み取り専用データの公開」だけに絞れる。

## 3. 主要な設計判断とその理由

### 3.1 認証なし・完全公開

当初は合言葉によるパスワード認証を実装していたが、一般公開する方針に変更したため撤去した
（旧実装: `src/proxy.ts` / `src/lib/auth.ts` / `src/app/login` — 現在は存在しない）。
再度クローズドにしたい場合は、Next 16での認証ガードは `middleware.ts` ではなく **`proxy.ts`**
（`src/proxy.ts`、ファイル/エクスポート名が `middleware` → `proxy` に変更されている）で実装すること。
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` を先に読むこと。

### 3.2 Supabase未設定でもサンプルデータで起動する

`src/lib/data.ts` の `getChannelsWithMetrics()` は、`NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` が未設定、またはクエリが失敗した場合に
`src/lib/sample-data.ts` の架空データへ自動フォールバックする（`isSample: true` を返す）。
UIには `isSample` に応じたバナーが出る（`ChannelDashboard.tsx`）。
これはローカル開発・レビュー・デモを、Supabaseプロジェクトを用意せずに即座に行えるようにするための設計。
**サンプルデータは実在のチャンネル・人物と一切関係のない架空データにすること**（実名・実サムネイルを使わない）。

### 3.3 ISR（`revalidate = 300`）でDB負荷と鮮度のバランスを取る

`src/app/page.tsx` は `export const revalidate = 300` を指定している。
バッチ取り込みは1日1回程度しか実データを更新しないため、毎リクエストSupabaseに問い合わせる必要はない。
一方で完全な静的ビルド（`force-static`／revalidateなし）にすると再デプロイしない限りデータが更新されないため、
「数分単位のISR」という中間案を採用した。バッチの実行頻度を上げる場合はこの値も見直すこと。

### 3.4 掲載基準は「自動判定できるもの」と「人手が必要なもの」を明確に分離した

要件の掲載基準は3つ:

1. 登録者数1,000人以上 → **自動判定可能**（YouTube API `statistics.subscriberCount`）
2. デュエル・マスターズを主コンテンツとしていること → **自動判定は信頼できない**
3. 直近30日以内に1本以上の投稿があること → **自動判定可能**

2番目のコンテンツ整合性はタイトル・説明文のキーワード一致などでは誤判定が多く、
チャンネル一覧の質を担保する上で最も重要な基準にもかかわらず自動化に向かない。
そのため **`config/channel-candidates.json` への登録行為そのものを人手レビューのゲート**
として設計した（バッチ処理は候補リストにあるチャンネルの1・3のみを自動判定し、
`channels.is_active` に反映する）。この分離方針を崩して「全チャンネルを自動探索して登録」のような
実装に変えないこと（内容の伴わないチャンネルが混入し、ダッシュボードの信頼性が下がる）。

### 3.5 動画フォーマットの除外ロジック

`scripts/lib/metrics.ts` / `scripts/fetch-youtube-data.ts` 参照。

- **ショート判定**: `duration <= SHORTS_MAX_DURATION_SECONDS`（既定180秒、環境変数で調整可）。
  YouTube側の「ショート」タグはAPIで直接取れないため、動画尺による近似判定にしている。
  境界値なので、閾値を変えると集計結果が変わることに注意。
- **生配信判定**: `liveStreamingDetails` が存在するかどうか（過去に配信だった動画にも付与される）。
- **アクティブ性判定**（掲載基準3）は **動画フォーマットを問わない**。ショートだけ投稿しているチャンネルも
  「活動している」とはみなすが、平均再生数の集計対象には入れない、という非対称な扱いが意図的な設計。

### 3.6 指標計算式（`scripts/lib/metrics.ts`）

- **直近30本平均**: 通常動画（ショート・生配信除外後）を投稿日時降順に並べ、先頭30本（足りなければ全件）の再生数平均。
- **直近30日平均**: 通常動画のうち過去30日以内に投稿されたものの再生数平均。
- どちらも対象0件なら0を返す（NaN/Infinityを表示しない）。
- **UIのメイン指標は「直近30日平均」のみ**。「直近30本平均」はオーナー判断で表示・ソート対象から外した
  （今まさに勢いがあるかを軸に比較したいため）。ただしバッチでの計算と `channel_metrics.avg_views_last_30_videos`
  への保存は残しており、将来また表示したくなった場合にスキーマ変更なしで戻せるようにしている。
  `fetchRecentVideoIds` が「30本集まるまで」ページングするのもこの指標のため。
- ソート指標は `直近30日平均` / `30日投稿数`（通常動画の本数）/ `登録者数`（`SortMetric`）。
- **チャンネル詳細画面**（`/channels/[id]`）の動画一覧・グラフは `metrics.updatedAt`（バッチ集計時刻）から
  30日を切り出す。表示時刻を起点にすると一覧の「直近30日平均」と別の動画集合になってしまうため。

これらの関数は `scripts/verify-metrics.ts`（`npm run verify-metrics`）で最低限の回帰確認をしている。
計算式を変更したらこのスクリプトのアサーションも更新すること。

### 3.7 YouTube APIクォータへの配慮

`channels.list` / `playlistItems.list` / `videos.list` はいずれもIDをカンマ区切りで最大50件まで
一括指定できるため、`scripts/lib/youtube.ts` の `fetchChannels` / `fetchVideos` は必ずチャンク化して呼ぶ。
1チャンネルあたりのAPI呼び出しを増やさないことが、候補チャンネル数のスケーラビリティに直結する。
`fetchRecentVideoIds` は「30本集まった」かつ「最古の動画が30日より前」になった時点でページングを打ち切る
（無駄なページ取得をしない）。

### 3.8 shadcn/ui CLIを使わず手書きTailwindにした

要件定義書ではshadcn/ui利用が推奨例として挙がっているが、CLIはネットワーク依存のインタラクティブな
コンポーネント取得を伴うため、環境非依存で確実にビルドできることを優先し、Tailwindの素のクラスで
UIコンポーネント（`src/components/ChannelDashboard.tsx`）を書いている。将来的にshadcn/uiを導入する場合は
既存コンポーネントの見た目・挙動（タグフィルタ、ソート、Top20/全件切替）を壊さないよう置き換えること。

## 4. ディレクトリ構成

```
src/
  app/
    layout.tsx        ルートレイアウト（メタデータ、フォント、背景色）
    page.tsx           一覧ページ。サーバーコンポーネントでデータ取得しChannelDashboardへ渡す
    channels/[id]/page.tsx  チャンネル詳細。初回アクセス時に生成しISR（generateStaticParams は空配列）
    globals.css
  components/
    ChannelDashboard.tsx  クライアントコンポーネント。フィルタ/ソート/表示件数はここで完結（サーバーには問い合わせない）
    ChannelParts.tsx      サンプル表示バナー・アイコン・タグなど一覧/詳細共通の小部品
    ViewsChart.tsx         詳細画面の通常動画ごとの再生数グラフ（CSSのみ、ホバー/フォーカスで値表示）
  lib/
    types.ts           Channel / Video / ChannelMetrics 等のドメイン型。要件定義書のデータモデルと1:1
    supabase.ts         読み取り用(anon)・書き込み用(service role)クライアントの生成
    data.ts             getChannelsWithMetrics() / getChannelDetail()。Supabase→サンプルデータのフォールバックを内包
    sample-data.ts       架空チャンネル・架空動画のフィクスチャ（動画は metrics と平均・本数が一致するよう生成）
    format.ts            表示用の数値フォーマッタ（コンパクト表記）

scripts/                Next.jsアプリとは独立したNode CLIバッチ（tsxで実行、ビルド成果物には含まれない）
  fetch-youtube-data.ts  エントリポイント。候補読み込み→API取得→集計→Supabase upsert
  lib/
    youtube.ts            YouTube Data APIのfetchラッパー（チャンク化・リトライ）
    duration.ts           ISO8601 duration → 秒数
    metrics.ts             集計ロジック（アプリ本体とロジックを共有するため src/lib/types.ts の Video 型を使う）
  verify-metrics.ts       metrics.tsの簡易回帰テスト

config/
  channel-candidates.json          実際に登録するチャンネル候補（人手キュレーション、要件3.2参照）
  channel-candidates.example.json  フォーマット例

supabase/migrations/0001_init.sql  スキーマ定義（channels / videos / channel_metrics、RLSポリシー含む）
supabase/migrations/0002_video_title.sql  videos.title 追加（詳細画面の動画一覧用。snippetは取得済みのためクォータ増なし）

.github/workflows/fetch-data.yml   バッチの日次実行（cron）
```

## 5. 開発フロー

```bash
npm install
cp .env.example .env.local   # Supabase未設定でもサンプルデータで動く
npm run dev

npm run lint
npx tsc --noEmit
npm run build

npm run verify-metrics        # 集計ロジックの回帰確認
npm run fetch-youtube-data    # 実データ取り込み（要 YOUTUBE_API_KEY / SUPABASE_SERVICE_ROLE_KEY）
```

## 6. 変更時に踏み外しやすいポイント

- **タグの追加/変更**: `src/lib/types.ts` の `TAG_OPTIONS` を変更したら、`config/channel-candidates.json` の
  既存データや `supabase/migrations` のGINインデックス方針に矛盾がないか確認する。タグはPostgresの`text[]`に
  そのまま格納しており、正規化されたタグテーブルは存在しない（意図的にシンプルに保っている）。
- **書き込み経路を増やさない**: Next.jsアプリ側（`src/`配下）からSupabaseへ書き込むコードを追加しない。
  書き込みは常に `scripts/fetch-youtube-data.ts`（service role key）経由に限定する。
- **`isSample` フラグを無視しない**: UIやAPIレスポンスにサンプルデータと実データを混在させない。
  どちらか一方のみを返す設計を維持する。
- **ショート/生配信の閾値変更**: `SHORTS_MAX_DURATION_SECONDS` を変えると既存の `channel_metrics` の値と
  整合しなくなるため、変更後は `npm run fetch-youtube-data` を再実行して再集計すること。
