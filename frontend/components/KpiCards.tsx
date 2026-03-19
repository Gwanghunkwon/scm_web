"use client";

import { KpiData } from "@/lib/types";

type Props = {
  data: KpiData;
};

export function KpiCards({ data }: Props) {
  const cards = [
    { title: "Low Stock Items", value: data.totalShortageMaterials.toLocaleString() },
    { title: "Total Order Needed", value: `${data.totalRequiredProcurementQty.toLocaleString()} kg` },
    { title: "Estimated Cost", value: `₩${data.estimatedProcurementCost.toLocaleString()}` },
    { title: "Most Critical", value: data.mostCriticalMaterial },
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
