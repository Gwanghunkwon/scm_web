"use client";

import { InventoryRequiredChart } from "@/components/InventoryRequiredChart";
import { KpiCards } from "@/components/KpiCards";
import { MaterialDetailModal } from "@/components/MaterialDetailModal";
import { PeriodToggle } from "@/components/PeriodToggle";
import { ProcurementForecastChart } from "@/components/ProcurementForecastChart";
import { ProductFilter } from "@/components/ProductFilter";
import { ShortageTable } from "@/components/ShortageTable";
import { getDashboardData } from "@/lib/api";
import { products } from "@/lib/mock-data";
import { DashboardResponse, MaterialRow, Period } from "@/lib/types";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("3M");
  const [productId, setProductId] = useState("all");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialRow | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const nextData = await getDashboardData(period, productId);
      if (mounted) setData(nextData);
    })();
    return () => {
      mounted = false;
    };
  }, [period, productId]);

  if (!data) {
    return <main className="mx-auto max-w-7xl p-6">Loading dashboard...</main>;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">SCM Dashboard</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ProductFilter products={products} value={productId} onChange={setProductId} />
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>
      </section>

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
