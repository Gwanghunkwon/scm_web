"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "대시보드" },
  { href: "/items", label: "품목(제품·원재료)" },
  { href: "/warehouses", label: "창고" },
  { href: "/bom", label: "배합비(BOM)" },
  { href: "/inventory", label: "재고" },
  { href: "/production-plans", label: "생산계획" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white shadow-soft">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          SCM <span className="text-stock">MVP</span>
        </Link>
        <nav className="flex flex-wrap gap-1.5 text-sm">
          {links.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  active
                    ? "bg-stock text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
