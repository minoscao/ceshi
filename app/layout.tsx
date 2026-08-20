import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "弈间 · 线上五子棋",
  description: "一款简洁雅致的线上五子棋，支持挑战 AI 与双人同屏对弈。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
