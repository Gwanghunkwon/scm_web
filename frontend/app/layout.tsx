import type { Metadata } from "next";
import "./globals.css";

import { AppNav } from "@/components/AppNav";

export const metadata: Metadata = {
  title: "SCM MVP",
  description: "BOM·재고·생산계획 기반 발주 시뮬레이션",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <AppNav />
        {children}
      </body>
    </html>
  );
}
