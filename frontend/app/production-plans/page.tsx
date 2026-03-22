"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createProductionPlan,
  deleteProductionPlan,
  fetchItems,
  fetchProductionPlans,
} from "@/lib/api";
import type { Item, ProductionPlanRecord } from "@/lib/types";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-soft outline-none focus:border-stock";

export default function ProductionPlansPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [plans, setPlans] = useState<ProductionPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const products = useMemo(() => items.filter((i) => i.type === "PRODUCT"), [items]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [it, pl] = await Promise.all([fetchItems(), fetchProductionPlans()]);
      setItems(it);
      setPlans(pl);
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "불러오기 실패",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const item_id = Number(fd.get("item_id"));
    const period_start = String(fd.get("period_start") || "");
    const period_end = String(fd.get("period_end") || "");
    const quantity = Number(fd.get("quantity"));
    const status = String(fd.get("status") || "DRAFT").trim() || "DRAFT";
    const version = String(fd.get("version") || "").trim() || null;

    if (!item_id || !period_start || !period_end || !Number.isFinite(quantity)) {
      setMessage({ type: "err", text: "제품·기간·수량을 확인하세요." });
      return;
    }
    try {
      await createProductionPlan({
        item_id,
        period_start,
        period_end,
        quantity,
        status,
        version,
      });
      setMessage({ type: "ok", text: "생산계획이 등록되었습니다." });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "등록 실패",
      });
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("이 생산계획을 삭제할까요?")) return;
    try {
      await deleteProductionPlan(id);
      setMessage({ type: "ok", text: "삭제되었습니다." });
      await load();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "삭제 실패",
      });
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">생산 계획</h1>
        <p className="mt-1 text-sm text-slate-600">
          기간별 생산(판매) 수량을 기록합니다. 대시보드의 “예상 생산량”과 별도이며, 추후 연동할 수 있습니다.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            message.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
        >
          <h2 className="text-lg font-medium text-slate-800">계획 등록</h2>
          <label className="block text-sm">
            <span className="text-slate-600">제품</span>
            <select name="item_id" className={inputClass} required defaultValue="">
              <option value="" disabled>
                선택
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">기간 시작</span>
            <input name="period_start" type="date" className={inputClass} required />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">기간 종료</span>
            <input name="period_end" type="date" className={inputClass} required />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">계획 수량</span>
            <input name="quantity" type="number" className={inputClass} step="any" min={0} required />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">상태</span>
            <input name="status" className={inputClass} defaultValue="DRAFT" placeholder="DRAFT" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">버전 (선택)</span>
            <input name="version" className={inputClass} placeholder="v1" />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-stock px-4 py-2.5 text-sm font-medium text-white"
          >
            등록
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-medium text-slate-800">등록된 계획</h2>
          {loading ? (
            <p className="text-sm text-slate-500">불러오는 중...</p>
          ) : (
            <div className="max-h-[480px] overflow-auto text-sm">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-2">제품</th>
                    <th className="p-2">기간</th>
                    <th className="p-2">수량</th>
                    <th className="p-2">상태</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {plans.map((pl) => {
                    const it = byId.get(pl.item_id);
                    return (
                      <tr key={pl.id} className="border-t border-slate-100">
                        <td className="p-2">{it ? `${it.code}` : pl.item_id}</td>
                        <td className="p-2">
                          {pl.period_start} ~ {pl.period_end}
                        </td>
                        <td className="p-2">{pl.quantity}</td>
                        <td className="p-2">{pl.status}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => onDelete(pl.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {plans.length === 0 && (
                <p className="py-6 text-center text-slate-500">계획이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
