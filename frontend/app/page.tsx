"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { InventoryRequiredChart } from "@/components/InventoryRequiredChart";
import { KpiStatCard } from "@/components/KpiStatCard";
import { PeriodToggle } from "@/components/PeriodToggle";
import { ProcurementForecastChart } from "@/components/ProcurementForecastChart";
import { ProductFilter } from "@/components/ProductFilter";
import { ShortageTable } from "@/components/ShortageTable";
import { TodoItem } from "@/components/TodoItem";
import { checkApiHealth, fetchItems, getDashboardData } from "@/lib/api";
import type { DashboardResponse, Item, MaterialRow, Period } from "@/lib/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("3M");
  const [productId, setProductId] = useState<string>("");
  const [productionQty, setProductionQty] = useState<number>(100);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [apiHealth, setApiHealth] = useState<{ ok: boolean; detail: string } | null>(null);

  const productItems = useMemo(() => allItems.filter((i) => i.type === "PRODUCT"), [allItems]);

  useEffect(() => {
    checkApiHealth().then(setApiHealth);
    fetchItems().then((items) => {
      setAllItems(items);
      const first = items.find((i) => i.type === "PRODUCT");
      if (first) setProductId(String(first.id));
    });
  }, []);

  useEffect(() => {
    if (!productId) return;
    getDashboardData(period, productId, Math.max(0, productionQty)).then(setData);
  }, [period, productId, productionQty]);

  const todoRows = [
    { title: "원재료 발주", date: "오늘" },
    { title: "생산 시작", date: "오늘+1" },
    { title: "출고 준비", date: "오늘+2" },
  ];

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-4xl font-bold tracking-tight">SCM Dashboard</h1>

      <div className={`rounded-2xl border px-4 py-2 text-xs ${apiHealth?.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
        API Health: {apiHealth?.ok ? "Connected" : `Disconnected (${apiHealth?.detail ?? "checking"})`}
      </div>

      {productItems.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          제품이 없습니다. <Link href="/items" className="font-semibold underline">Products</Link>에서 등록하세요.
        </div>
      ) : null}

      <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <ProductFilter
          products={productItems.map((p) => ({ id: String(p.id), name: p.name }))}
          value={productId}
          onChange={setProductId}
        />
        <PeriodToggle value={period} onChange={setPeriod} />
        <input
          type="number"
          min={0}
          step="any"
          value={productionQty}
          onChange={(e) => setProductionQty(Number(e.target.value))}
          className="h-10 w-36 rounded-xl border border-slate-200 px-3 text-sm"
          placeholder="Production"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <KpiStatCard title="Inventory Value" value={data ? `${Math.round(data.kpis.totalRequiredProcurementQty * 1000)}` : "-"} />
        <KpiStatCard title="Risk SKU" value={data?.kpis.totalShortageMaterials ?? "-"} tone="danger" />
        <KpiStatCard title="Upcoming Production" value={productionQty} />
        <KpiStatCard title="Upcoming Orders" value={data?.kpis.totalRequiredProcurementQty ?? "-"} tone="warning" />
        <KpiStatCard title="Expiring Products" value={"2"} tone="warning" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <InventoryRequiredChart rows={((data?.stockVsRequired ?? []) as MaterialRow[])} />
        <ProcurementForecastChart data={data?.forecast ?? []} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="mb-2 text-lg font-semibold">52 Week Risk Table</h2>
          <ShortageTable rows={data?.stockVsRequired ?? []} onRowClick={() => undefined} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="mb-2 text-lg font-semibold">Today&apos;s SCM To-Do</h2>
          {todoRows.map((t) => (
            <TodoItem key={t.title} title={t.title} date={t.date} />
          ))}
        </div>
      </section>
    </div>
  );
}
