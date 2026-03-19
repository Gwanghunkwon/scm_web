"use client";

import { useEffect, useMemo, useState } from "react";

import { InventoryRequiredChart } from "@/components/InventoryRequiredChart";
import { KpiCards } from "@/components/KpiCards";
import { MaterialDetailModal } from "@/components/MaterialDetailModal";
import { PeriodToggle } from "@/components/PeriodToggle";
import { ProcurementForecastChart } from "@/components/ProcurementForecastChart";
import { ProductFilter } from "@/components/ProductFilter";
import { ShortageTable } from "@/components/ShortageTable";
import { fetchItems, getDashboardData } from "@/lib/api";
import { MaterialRow, Period } from "@/lib/types";
import type { DashboardResponse, Item } from "@/lib/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("3M");
  const [productId, setProductId] = useState<string>("");
  const [productionQty, setProductionQty] = useState<number>(0);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialRow | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const [allItems, setAllItems] = useState<Item[]>([]);

  const productItems = useMemo(
    () => allItems.filter((i) => i.type === "PRODUCT"),
    [allItems]
  );

  useEffect(() => {
    setProductLoading(true);
    fetchItems()
      .then((items) => {
        setAllItems(items);
        const firstProduct = items.find((i) => i.type === "PRODUCT");
        if (firstProduct) setProductId(String(firstProduct.id));
      })
      .finally(() => setProductLoading(false));
  }, []);

  useEffect(() => {
    if (!productId || productionQty <= 0) return;
    setCalculating(true);
    getDashboardData(period, productId, productionQty)
      .then((next) => setData(next))
      .finally(() => setCalculating(false));
  }, [period, productId, productionQty]);

  if (!data) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        {productLoading ? "품목 불러오는 중..." : "대시보드 데이터 준비 중..."}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          SCM 대시보드
        </h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ProductFilter
            products={productItems.map((p) => ({ id: String(p.id), name: p.name }))}
            value={productId}
            onChange={setProductId}
          />
          <PeriodToggle value={period} onChange={setPeriod} />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">예상 생산량</label>
            <input
              type="number"
              min={0}
              step="any"
              value={productionQty}
              onChange={(e) => setProductionQty(Number(e.target.value))}
              className="h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-soft outline-none focus:border-stock"
            />
          </div>
        </div>
      </section>

      {calculating && (
        <div className="text-sm text-slate-500">계산 중...</div>
      )}

      <KpiCards data={data.kpis} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <InventoryRequiredChart rows={data.stockVsRequired} />
        <ProcurementForecastChart data={data.forecast} />
      </section>

      <ShortageTable rows={data.stockVsRequired} onRowClick={setSelectedMaterial} />
      <MaterialDetailModal material={selectedMaterial} onClose={() => setSelectedMaterial(null)} />
    </main>
  );
}
