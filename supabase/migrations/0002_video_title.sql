-- チャンネル詳細画面で動画一覧を表示するため、動画タイトルを保持する。
-- videos.list は既に part=snippet で取得しているため、YouTube APIのクォータ消費は増えない。
alter table videos add column if not exists title text not null default '';
