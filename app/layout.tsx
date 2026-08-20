import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "弈间 · 线上五子棋",
  description: "一款简洁雅致的双人线上五子棋，落子即刻开局。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
