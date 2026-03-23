import type { Metadata } from "next";
import "./globals.css";

import { AppNav, SideNav } from "@/components/AppNav";

export const metadata: Metadata = {
  title: "SCM MVP",
  description: "SCM auto scheduling platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AppNav />
        <main className="mx-auto max-w-[1400px] px-4 py-4 md:px-6">
          <div className="flex gap-4">
            <SideNav />
            <section className="min-w-0 flex-1">{children}</section>
          </div>
        </main>
      </body>
    </html>
  );
}
