-- デュエマYouTuber分析・閲覧ダッシュボード: 初期スキーマ

create table if not exists channels (
  id text primary key,                       -- YouTube Channel ID
  title text not null,
  thumbnail_url text not null default '',
  subscriber_count bigint not null default 0,
  tags text[] not null default '{}',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists channels_subscriber_count_idx on channels (subscriber_count desc);
create index if not exists channels_tags_idx on channels using gin (tags);
create index if not exists channels_is_active_idx on channels (is_active);

create table if not exists videos (
  id text primary key,                        -- YouTube Video ID
  channel_id text not null references channels (id) on delete cascade,
  published_at timestamptz not null,
  view_count bigint not null default 0,
  duration integer not null default 0,         -- 秒数
  is_short boolean not null default false,
  is_live_archive boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists videos_channel_published_idx on videos (channel_id, published_at desc);

create table if not exists channel_metrics (
  channel_id text primary key references channels (id) on delete cascade,
  avg_views_last_30_videos numeric not null default 0,
  avg_views_last_30_days numeric not null default 0,
  last_30_days_video_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ダッシュボードはアプリ側の合言葉認証のみで保護される公開参照用データのため、
-- anon ロールからの読み取りを許可し、書き込みはバッチ処理(service role)のみに限定する。
alter table channels enable row level security;
alter table videos enable row level security;
alter table channel_metrics enable row level security;

drop policy if exists "channels_public_read" on channels;
create policy "channels_public_read" on channels for select using (true);

drop policy if exists "videos_public_read" on videos;
create policy "videos_public_read" on videos for select using (true);

drop policy if exists "channel_metrics_public_read" on channel_metrics;
create policy "channel_metrics_public_read" on channel_metrics for select using (true);
