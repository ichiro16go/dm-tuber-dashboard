# デュエマYouTuberダッシュボード

デュエル・マスターズ関連YouTuberの活動データを収集・集計し、ショート動画・生配信の影響を除いた
「通常（横）動画」のパフォーマンスを比較するための閲覧用Webダッシュボード。

## 構成

- **フロントエンド**: Next.js (App Router) / TypeScript / Tailwind CSS
- **DB**: Supabase (PostgreSQL)
- **データ収集バッチ**: `scripts/fetch-youtube-data.ts`（YouTube Data API v3）、GitHub Actions で日次実行
- **公開範囲**: 認証なしの一般公開ページ

未設定でも `npm run dev` で起動でき、その場合はサンプルデータでUIを確認できます（画面上部にバナー表示）。

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local を編集
npm run dev
```

### 環境変数（`.env.example` 参照）

| 変数名 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | アプリの読み取り用（未設定ならサンプルデータ表示） |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_URL` | バッチ処理の書き込み専用。**ブラウザに露出させないこと** |
| `YOUTUBE_API_KEY` | バッチ処理専用のYouTube Data APIキー |
| `SHORTS_MAX_DURATION_SECONDS` | ショート動画とみなす動画尺の閾値（秒）。省略時180秒 |

### Supabaseのセットアップ

1. Supabaseプロジェクトを作成
2. `supabase/migrations/0001_init.sql` をSQL Editorで実行（`channels` / `videos` / `channel_metrics` テーブルを作成）
3. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` をアプリに、`SUPABASE_SERVICE_ROLE_KEY` をバッチ処理側に設定

## データ収集バッチ

`config/channel-candidates.json` に登録候補チャンネルのYouTube Channel IDとタグを記載します
（`config/channel-candidates.example.json` を参照）。掲載基準（[要件定義書](#掲載基準) 参照）のうち
「デュエル・マスターズを主コンテンツとしていること」はAPIで自動判定できないため、
**このファイルへの登録自体を人手によるコンテンツ確認の場**としています。

登録者数1,000人以上・直近30日以内の投稿ありという基準はバッチ側で自動判定し、
満たさないチャンネルは `channels.is_active = false` として保存され、ダッシュボードには表示されません。

```bash
# ローカル実行（.env.local に YOUTUBE_API_KEY / SUPABASE_SERVICE_ROLE_KEY が必要）
npm run fetch-youtube-data

# 集計ロジックの単体検証
npm run verify-metrics
```

GitHub Actions (`.github/workflows/fetch-data.yml`) で毎日 JST 6:00 に自動実行されます。
リポジトリの Settings → Secrets に `YOUTUBE_API_KEY` / `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を登録してください。

### 集計ロジック

- **ショート動画の除外**: 動画尺が `SHORTS_MAX_DURATION_SECONDS`（既定180秒）以下の動画を除外
- **生配信アーカイブの除外**: `liveStreamingDetails` を持つ動画を除外
- **直近30本平均再生数**: 通常動画（上記除外後）の最新30本の再生数平均
- **直近30日平均再生数**: 通常動画のうち過去30日以内に投稿されたものの再生数平均
- **アクティブ性判定**: フォーマットを問わず、直近30日以内に1本でも投稿があるか

## 掲載基準

1. チャンネル登録者数: 1,000人以上
2. コンテンツ整合性: デュエル・マスターズ（紙・デュエプレ・関連配信）を主コンテンツとしていること（人手で `config/channel-candidates.json` に登録）
3. アクティブ性: 直近30日以内に1本以上の新規動画投稿があること

## デプロイ

Vercelへのデプロイを想定しています。環境変数を設定したうえで通常のNext.jsアプリとしてデプロイしてください。
バッチ処理はVercel Cron、またはGitHub Actionsのいずれかで日次〜数回実行してください（このリポジトリにはGitHub Actions版を同梱）。
