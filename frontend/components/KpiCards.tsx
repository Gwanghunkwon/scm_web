"use client";

import { KpiData } from "@/lib/types";

type Props = {
  data: KpiData;
};

export function KpiCards({ data }: Props) {
  const cards = [
    { title: "부족 원재료 수", value: data.totalShortageMaterials.toLocaleString() },
    { title: "총 발주 필요량", value: data.totalRequiredProcurementQty.toLocaleString() },
    { title: "예상 발주 비용(옵션)", value: `₩${data.estimatedProcurementCost.toLocaleString()}` },
    { title: "가장 중요한 부족 품목", value: data.mostCriticalMaterial },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
        >
          <p className="text-sm text-slate-500">{card.title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
