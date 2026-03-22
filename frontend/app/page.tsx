"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { InventoryRequiredChart } from "@/components/InventoryRequiredChart";
import { KpiCards } from "@/components/KpiCards";
import { MaterialDetailModal } from "@/components/MaterialDetailModal";
import { PeriodToggle } from "@/components/PeriodToggle";
import { ProcurementForecastChart } from "@/components/ProcurementForecastChart";
import { ProductFilter } from "@/components/ProductFilter";
import { ShortageTable } from "@/components/ShortageTable";
import { fetchItems, fetchProductionPlans, getDashboardData } from "@/lib/api";
import { sumPlannedQtyInHorizon } from "@/lib/productionPlanDashboard";
import { MaterialRow, Period } from "@/lib/types";
import type { DashboardResponse, Item, ProductionPlanRecord } from "@/lib/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("3M");
  const [productId, setProductId] = useState<string>("");
  // 0이면 대시보드 API가 호출되지 않아 화면이 "준비 중"에 멈춤 → 기본값으로 첫 로드 시 바로 계산
  const [productionQty, setProductionQty] = useState<number>(100);
  /** true면 DB 생산계획(기간 겹침 합계)으로 예상 생산량 동기화 */
  const [syncProductionFromPlans, setSyncProductionFromPlans] = useState(true);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialRow | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [productionPlans, setProductionPlans] = useState<ProductionPlanRecord[]>([]);
  /** 품목 API 실패 시(특히 Vercel에서 NEXT_PUBLIC_API_URL 미설정) 안내용 */
  const [apiLoadError, setApiLoadError] = useState<string | null>(null);

  const productItems = useMemo(
    () => allItems.filter((i) => i.type === "PRODUCT"),
    [allItems]
  );

  const plannedSumForSelection = useMemo(() => {
    if (!productId) return 0;
    return sumPlannedQtyInHorizon(Number(productId), period, productionPlans);
  }, [productId, period, productionPlans]);

  useEffect(() => {
    setProductLoading(true);
    setApiLoadError(null);
    Promise.all([fetchItems(), fetchProductionPlans()])
      .then(([items, plans]) => {
        setAllItems(items);
        setProductionPlans(plans);
        const firstProduct = items.find((i) => i.type === "PRODUCT");
        if (firstProduct) setProductId(String(firstProduct.id));
      })
      .catch((err) => {
        setAllItems([]);
        setProductionPlans([]);
        setApiLoadError(
          err instanceof Error ? err.message : "서버에서 데이터를 가져오지 못했습니다."
        );
      })
      .finally(() => setProductLoading(false));
  }, []);

  useEffect(() => {
    if (!productId || !syncProductionFromPlans) return;
    setProductionQty(plannedSumForSelection);
  }, [productId, period, plannedSumForSelection, syncProductionFromPlans]);

  useEffect(() => {
    if (!productId) return;
    setCalculating(true);
    getDashboardData(period, productId, Math.max(0, productionQty))
      .then((next) => setData(next))
      .finally(() => setCalculating(false));
  }, [period, productId, productionQty]);

  if (productLoading) {
    return (
      <main className="mx-auto max-w-7xl p-6 text-slate-600">품목 불러오는 중...</main>
    );
  }

  if (productItems.length === 0) {
    return (
      <main className="mx-auto max-w-7xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold text-slate-900">SCM 대시보드</h1>
        {apiLoadError ? (
          <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p>
              <strong>API에 연결하지 못했습니다.</strong> ({apiLoadError})
            </p>
            <p>
              <strong>Vercel</strong>(예:{" "}
              <span className="font-mono text-xs">scm-web-delta.vercel.app</span>)에서 쓸 때는
              빌드에{" "}
              <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-xs">
                NEXT_PUBLIC_API_URL
              </code>
              를 <strong>공개 백엔드 주소</strong>(https://…)로 설정해야 합니다.{" "}
              <code className="font-mono text-xs">localhost</code>는 브라우저에서 동작하지
              않습니다.
            </p>
            <p className="text-xs text-red-800">
              Vercel → Project → Settings → Environment Variables → 재배포. 자세한 내용은 저장소{" "}
              <code className="font-mono">docs/VERCEL.md</code> 참고.
            </p>
          </div>
        ) : (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            등록된 <strong>제품(PRODUCT)</strong>이 없습니다. 아래에서 품목을 등록한 뒤 이 페이지를
            새로고침하세요.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/items"
            className="inline-flex items-center rounded-xl bg-stock px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-blue-700"
          >
            품목 등록 (제품·원재료)
          </Link>
          <Link
            href="/warehouses"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-soft hover:bg-slate-50"
          >
            창고 등록
          </Link>
          <Link
            href="/bom"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-soft hover:bg-slate-50"
          >
            BOM / 엑셀 업로드
          </Link>
          <Link
            href="/inventory"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-soft hover:bg-slate-50"
          >
            재고 입력
          </Link>
          <Link
            href="/production-plans"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-soft hover:bg-slate-50"
          >
            생산계획
          </Link>
        </div>
      </main>
    );
  }

  if (!productId || data === null) {
    return (
      <main className="mx-auto max-w-7xl p-6 text-slate-600">
        {productId ? "대시보드 계산 중..." : "제품을 선택하는 중..."}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">예상 생산량</label>
              <input
                type="number"
                min={0}
                step="any"
                value={Number.isNaN(productionQty) ? 0 : productionQty}
                onChange={(e) => {
                  setSyncProductionFromPlans(false);
                  setProductionQty(Number(e.target.value));
                }}
                disabled={syncProductionFromPlans}
                className="h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-soft outline-none focus:border-stock disabled:bg-slate-100"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={syncProductionFromPlans}
                onChange={(e) => setSyncProductionFromPlans(e.target.checked)}
              />
              생산계획 자동 반영 (DB)
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-soft">
        <span>
          선택 기간(오늘~{period.replace("M", "")}개월)과 <strong>겹치는</strong> 생산계획 수량 합계:{" "}
          <strong className="text-slate-900">{plannedSumForSelection}</strong>
          {syncProductionFromPlans ? (
            <span className="ml-2 text-emerald-700">→ 예상 생산량에 반영 중</span>
          ) : null}
        </span>
        <Link
          href="/production-plans"
          className="font-medium text-stock underline-offset-2 hover:underline"
        >
          생산계획 편집
        </Link>
      </div>

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
