"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { createWarehouse, deleteWarehouse, fetchWarehouses } from "@/lib/api";
import type { Warehouse } from "@/lib/types";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-soft outline-none focus:border-stock";

export default function WarehousesPage() {
  const [list, setList] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await fetchWarehouses());
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
    const code = String(fd.get("code") || "").trim();
    const name = String(fd.get("name") || "").trim();
    const warehouse_type = String(fd.get("warehouse_type") || "").trim().toUpperCase() || null;
    if (!code || !name) {
      setMessage({ type: "err", text: "코드와 이름을 입력하세요." });
      return;
    }
    try {
      await createWarehouse({ code, name, warehouse_type });
      e.currentTarget.reset();
      setMessage({ type: "ok", text: "창고가 등록되었습니다." });
      await load();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "등록 실패",
      });
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("창고를 삭제할까요? 재고가 있으면 실패할 수 있습니다.")) return;
    try {
      await deleteWarehouse(id);
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
    <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">창고</h1>
        <p className="mt-1 text-sm text-slate-600">재고 입력 시 창고를 선택합니다. 먼저 최소 1개를 등록하세요.</p>
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

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:flex-row sm:items-end"
      >
        <label className="block flex-1 text-sm">
          <span className="text-slate-600">코드</span>
          <input name="code" className={inputClass} placeholder="MAIN" required />
        </label>
        <label className="block flex-1 text-sm">
          <span className="text-slate-600">이름</span>
          <input name="name" className={inputClass} placeholder="본사 창고" required />
        </label>
        <label className="block flex-1 text-sm">
          <span className="text-slate-600">유형</span>
          <select name="warehouse_type" className={inputClass} defaultValue="WAREHOUSE">
            <option value="FACTORY">FACTORY</option>
            <option value="WAREHOUSE">WAREHOUSE</option>
            <option value="STORE">STORE</option>
          </select>
        </label>
        <button
          type="submit"
          className="h-10 shrink-0 rounded-xl bg-stock px-4 text-sm font-medium text-white"
        >
          추가
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-soft">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">불러오는 중...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">코드</th>
                <th className="p-3">이름</th>
                <th className="p-3">유형</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((w) => (
                <tr key={w.id} className="border-t border-slate-100">
                  <td className="p-3">{w.id}</td>
                  <td className="p-3 font-mono">{w.code}</td>
                  <td className="p-3">{w.name}</td>
                  <td className="p-3">{w.warehouse_type ?? "—"}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => onDelete(w.id)}
                      className="text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && list.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">등록된 창고가 없습니다.</p>
        )}
      </div>
    </main>
  );
}
