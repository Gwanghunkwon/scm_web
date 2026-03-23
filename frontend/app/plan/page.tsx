"use client";

import { FormEvent, useMemo, useState } from "react";

import { fetchItems, generate52wPlan } from "@/lib/api";
import type { Generate52wResponse, Item } from "@/lib/types";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-soft outline-none focus:border-stock";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function PlanPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [result, setResult] = useState<Generate52wResponse | null>(null);
  const [message, setMessage] = useState<string>("");

  const products = useMemo(() => items.filter((i) => i.type === "PRODUCT"), [items]);

  async function ensureItemsLoaded() {
    if (items.length > 0) return;
    setItems(await fetchItems());
  }

  const onGenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    await ensureItemsLoaded();
    const fd = new FormData(e.currentTarget);
    const product_id = Number(fd.get("product_id"));
    const start_date = String(fd.get("start_date") || todayISO());
    const current_inventory = Number(fd.get("current_inventory") || 0);
    const safety_stock = Number(fd.get("safety_stock") || 0);
    const moqRaw = String(fd.get("moq") || "").trim();
    const moq = moqRaw === "" ? null : Number(moqRaw);
    const production_leadtime_days = Number(fd.get("production_leadtime_days") || 0);
    const material_leadtime_days = Number(fd.get("material_leadtime_days") || 0);
    const capaRaw = String(fd.get("production_capa_per_day") || "").trim();
    const production_capa_per_day = capaRaw === "" ? null : Number(capaRaw);
    const weekly = Number(fd.get("weekly_forecast") || 0);

    const p = products.find((x) => x.id === product_id);
    if (!p) {
      setMessage("제품을 선택하세요.");
      return;
    }

    const forecast_by_week: Record<number, number> = {};
    for (let w = 1; w <= 52; w += 1) forecast_by_week[w] = weekly;

    try {
      const out = await generate52wPlan({
        product_id,
        product_name: p.name,
        start_date,
        current_inventory,
        safety_stock,
        moq,
        production_leadtime_days,
        material_leadtime_days,
        production_capa_per_day,
        forecast_by_week,
      });
      setResult(out);
      setMessage(`52주 계획 생성 완료 (${out.plans.length}주)`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "계획 생성 실패");
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">52주 SCM 계획</h1>
      <form onSubmit={onGenerate} className="grid gap-3 rounded-2xl border bg-white p-4 shadow-soft md:grid-cols-4">
        <select name="product_id" className={inputClass} required onFocus={ensureItemsLoaded} defaultValue="">
          <option value="" disabled>제품 선택</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="start_date" type="date" className={inputClass} defaultValue={todayISO()} />
        <input name="current_inventory" type="number" className={inputClass} placeholder="현재 재고" defaultValue={100} />
        <input name="safety_stock" type="number" className={inputClass} placeholder="안전재고" defaultValue={50} />
        <input name="moq" type="number" className={inputClass} placeholder="MOQ" defaultValue={0} />
        <input name="production_leadtime_days" type="number" className={inputClass} placeholder="생산 리드타임" defaultValue={5} />
        <input name="material_leadtime_days" type="number" className={inputClass} placeholder="원재료 리드타임" defaultValue={3} />
        <input name="production_capa_per_day" type="number" className={inputClass} placeholder="일 CAPA" defaultValue={300} />
        <input name="weekly_forecast" type="number" className={inputClass} placeholder="주간 예측수요" defaultValue={80} />
        <button type="submit" className="rounded-xl bg-stock px-4 py-2 text-white">생성</button>
      </form>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      {result ? (
        <div className="max-h-[520px] overflow-auto rounded-2xl border bg-white p-4 shadow-soft">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <th className="p-2 text-left">주차</th>
                <th className="p-2 text-left">수요</th>
                <th className="p-2 text-left">생산</th>
                <th className="p-2 text-left">예상재고</th>
                <th className="p-2 text-left">위험</th>
              </tr>
            </thead>
            <tbody>
              {result.plans.map((r) => (
                <tr key={r.week} className="border-t">
                  <td className="p-2">{r.week}</td>
                  <td className="p-2">{r.demand}</td>
                  <td className="p-2">{r.production}</td>
                  <td className="p-2">{r.inventory}</td>
                  <td className="p-2">{r.shortage_risk ? "주의" : "정상"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
