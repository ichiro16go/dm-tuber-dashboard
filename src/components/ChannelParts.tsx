import Image from "next/image";

// 一覧・詳細の両画面で使う小さな表示部品（サーバー/クライアントどちらからも使える）

export function SampleNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-[10px] border border-notice-line bg-notice-bg px-3.5 py-3 text-[13px] leading-relaxed text-notice md:items-center md:gap-3 md:px-[18px] md:text-sm">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 md:mt-0">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v5" />
        <path d="M12 16.5v.01" />
      </svg>
      <span>
        <b className="font-bold">サンプルデータを表示中</b>
        <span className="hidden md:inline">　</span>
        <br className="md:hidden" />
        Supabase が未設定のため、架空のチャンネルを表示しています。
      </span>
    </div>
  );
}

export function ChannelAvatar({ src, size }: { src: string; size: number }) {
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-track object-cover"
      unoptimized
    />
  );
}

export function TagChips({ tags, size = "sm" }: { tags: string[]; size?: "sm" | "md" }) {
  return (
    <div className="flex shrink-0 gap-1">
      {tags.map((t) => (
        <span
          key={t}
          className={`rounded-full bg-chip text-muted ${size === "md" ? "px-2 py-0.5 text-xs" : "px-[7px] text-[11px] leading-[18px]"}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
