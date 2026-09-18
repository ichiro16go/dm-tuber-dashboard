import type { Metadata } from "next";
import { Dela_Gothic_One, IBM_Plex_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

// 本文。和文グリフはunicode-range分割で必要分だけ読み込まれる。
const zenKakuGothic = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

// 見出し・順位用のディスプレイ書体。
const delaGothic = Dela_Gothic_One({
  variable: "--font-dela-gothic",
  weight: "400",
  subsets: ["latin"],
});

// 再生数などの数値用。
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "デュエマYouTuberダッシュボード",
  description: "デュエル・マスターズ関連YouTuberの通常動画パフォーマンス比較ダッシュボード",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${zenKakuGothic.variable} ${delaGothic.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ground font-sans text-ink">{children}</body>
    </html>
  );
}
