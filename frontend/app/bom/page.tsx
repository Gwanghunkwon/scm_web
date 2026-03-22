"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { createBom, deleteBom, fetchBoms, fetchItems } from "@/lib/api";
import { mapExcelRowsToBoms, parseBomExcel } from "@/lib/bomExcel";
import type { BomRecord, Item } from "@/lib/types";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-soft outline-none focus:border-stock";

export default function BomPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [boms, setBoms] = useState<BomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const products = useMemo(() => items.filter((i) => i.type === "PRODUCT"), [items]);
  const children = useMemo(() => items.filter((i) => i.type === "RAW" || i.type === "PRODUCT"), [items]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [it, bm] = await Promise.all([fetchItems(), fetchBoms()]);
      setItems(it);
      setBoms(bm);
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

  const onSubmitLine = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parent_item_id = Number(fd.get("parent_item_id"));
    const child_item_id = Number(fd.get("child_item_id"));
    const qty_per = Number(fd.get("qty_per"));
    if (!parent_item_id || !child_item_id || !Number.isFinite(qty_per) || qty_per <= 0) {
      setMessage({ type: "err", text: "제품·구성품·수량을 확인하세요." });
      return;
    }
    try {
      await createBom({ parent_item_id, child_item_id, qty_per });
      setMessage({ type: "ok", text: "BOM 라인이 추가되었습니다." });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "추가 실패",
      });
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadBusy(true);
    setMessage(null);
    try {
      const rows = await parseBomExcel(file);
      const { ok, errors } = mapExcelRowsToBoms(rows, items);
      if (errors.length) {
        setMessage({
          type: "err",
          text: `엑셀 검증:\n${errors.slice(0, 8).join("\n")}${errors.length > 8 ? `\n… 외 ${errors.length - 8}건` : ""}`,
        });
      }
      let created = 0;
      for (const row of ok) {
        try {
          await createBom(row);
          created += 1;
        } catch {
          /* 중복 등은 건너뜀 */
        }
      }
      await load();
      setMessage({
        type: ok.length ? "ok" : "err",
        text:
          `업로드 처리: 성공 ${created}건` +
          (errors.length ? `, 검증 오류 ${errors.length}건` : "") +
          (ok.length > created ? ` (일부 ${ok.length - created}건은 API 오류로 스킵)` : ""),
      });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "엑셀을 읽지 못했습니다.",
      });
    } finally {
      setUploadBusy(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("이 BOM 라인을 삭제할까요?")) return;
    try {
      await deleteBom(id);
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
        <h1 className="text-2xl font-semibold text-slate-900">배합비 (BOM)</h1>
        <p className="mt-1 text-sm text-slate-600">
          제품 1단위당 구성품(원재료) 소요량을 정의합니다. 엑셀 일괄 업로드를 지원합니다.
        </p>
      </div>

      {message && (
        <div
          className={`whitespace-pre-wrap rounded-2xl border p-4 text-sm ${
            message.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-medium text-slate-800">엑셀 업로드 (.xlsx)</h2>
        <p className="mt-2 text-xs text-slate-500">
          1행 헤더 예시:{" "}
          <code className="rounded bg-slate-100 px-1">제품코드</code>,{" "}
          <code className="rounded bg-slate-100 px-1">자재코드</code>,{" "}
          <code className="rounded bg-slate-100 px-1">qty_per</code>
          또는 <code className="rounded bg-slate-100 px-1">parent_item_id</code>,{" "}
          <code className="rounded bg-slate-100 px-1">child_item_id</code>,{" "}
          <code className="rounded bg-slate-100 px-1">qty_per</code>
          — 품목에 등록된 코드·ID와 일치해야 합니다.
        </p>
        <label className="mt-4 inline-block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 hover:bg-slate-100">
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            disabled={uploadBusy || loading}
            onChange={onFile}
          />
          {uploadBusy ? "처리 중…" : "파일 선택 (드래그 영역 클릭)"}
        </label>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={onSubmitLine}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
        >
          <h2 className="text-lg font-medium text-slate-800">수동 추가</h2>
          <label className="block text-sm">
            <span className="text-slate-600">제품 (부모)</span>
            <select name="parent_item_id" className={inputClass} required defaultValue="">
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
            <span className="text-slate-600">구성품 (자식)</span>
            <select name="child_item_id" className={inputClass} required defaultValue="">
              <option value="" disabled>
                선택
              </option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name} ({c.type})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">단위당 수량 (qty_per)</span>
            <input
              name="qty_per"
              type="number"
              className={inputClass}
              min={0}
              step="any"
              required
              placeholder="예: 0.1"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-stock px-4 py-2.5 text-sm font-medium text-white"
          >
            BOM 추가
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-medium text-slate-800">등록된 BOM</h2>
          {loading ? (
            <p className="text-sm text-slate-500">불러오는 중...</p>
          ) : (
            <div className="max-h-[420px] overflow-auto text-sm">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-2">제품</th>
                    <th className="p-2">구성품</th>
                    <th className="p-2">수량</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {boms.map((b) => {
                    const p = byId.get(b.parent_item_id);
                    const c = byId.get(b.child_item_id);
                    return (
                      <tr key={b.id} className="border-t border-slate-100">
                        <td className="p-2">{p ? `${p.code} · ${p.name}` : b.parent_item_id}</td>
                        <td className="p-2">{c ? `${c.code} · ${c.name}` : b.child_item_id}</td>
                        <td className="p-2">{b.qty_per}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => onDelete(b.id)}
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
              {boms.length === 0 && (
                <p className="py-6 text-center text-slate-500">BOM이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
