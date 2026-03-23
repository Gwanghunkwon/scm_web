import type { Metadata } from "next";
import "./globals.css";

import { AppNav } from "@/components/AppNav";

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
        <main className="mx-auto -mt-[72px] max-w-[1400px] px-4 pb-6 md:px-6">
          <div className="md:ml-60">{children}</div>
        </main>
      </body>
    </html>
  );
}
