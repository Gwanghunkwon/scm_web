/**
 * BOM 엑셀(.xlsx/.xls) 파싱 — 브라우저 전용, 클라이언트 컴포넌트에서만 import.
 */
import * as XLSX from "xlsx";

import type { Item } from "./types";

function norm(s: string): string {
  return s.replace(/\s|_/g, "").toLowerCase();
}

function getCell(row: Record<string, unknown>, aliases: string[]): unknown {
  const entries = Object.entries(row);
  for (const [key, val] of entries) {
    const nk = norm(key);
    for (const a of aliases) {
      if (nk === norm(a)) return val;
    }
  }
  for (const [key, val] of entries) {
    const nk = norm(key);
    for (const a of aliases) {
      const na = norm(a);
      if (nk.includes(na) || na.includes(nk)) return val;
    }
  }
  return undefined;
}

export type BomUploadRow = {
  parent_item_id: number;
  child_item_id: number;
  qty_per: number;
};

export async function parseBomExcel(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const name = wb.SheetNames[0];
  if (!name) return [];
  const sheet = wb.Sheets[name];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

/**
 * 엑셀 행 → BOM API용.
 * 지원 컬럼(헤더 이름 유연 매칭):
 * - 제품: parent_item_id | product_id | 제품코드 | product_code | parent_code
 * - 자재: child_item_id | material_id | 자재코드 | material_code | child_code
 * - 수량: qty_per | quantity | 수량 | 단위당수량
 */
export function mapExcelRowsToBoms(
  rows: Record<string, unknown>[],
  items: Item[]
): { ok: BomUploadRow[]; errors: string[] } {
  const byCode = new Map(
    items.map((i) => [String(i.code).trim().toUpperCase(), i.id])
  );
  const ok: BomUploadRow[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const line = idx + 2;
    const pidRaw = getCell(row, [
      "parent_item_id",
      "product_id",
      "제품id",
      "제품코드",
      "product_code",
      "parent_code",
      "제품 코드",
    ]);
    const cidRaw = getCell(row, [
      "child_item_id",
      "material_id",
      "자재id",
      "자재코드",
      "material_code",
      "child_code",
      "원재료코드",
      "자재 코드",
    ]);
    const qtyRaw = getCell(row, [
      "qty_per",
      "quantity",
      "수량",
      "단위당수량",
      "qty",
      "소요량",
    ]);

    const resolveId = (raw: unknown): number | undefined => {
      if (raw === undefined || raw === "") return undefined;
      const n = Number(String(raw).replace(/,/g, ""));
      if (Number.isFinite(n) && String(raw).trim() !== "" && /^\d+$/.test(String(raw).trim().replace(/,/g, ""))) {
        return Math.trunc(n);
      }
      const id = byCode.get(String(raw).trim().toUpperCase());
      return id;
    };

    const parentId = resolveId(pidRaw);
    const childId = resolveId(cidRaw);

    const qty = Number(String(qtyRaw).replace(/,/g, ""));

    if (parentId === undefined || childId === undefined) {
      errors.push(`${line}행: 제품/자재를 코드 또는 ID로 찾을 수 없습니다.`);
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.push(`${line}행: 수량(qty_per)은 0보다 커야 합니다.`);
      return;
    }
    ok.push({ parent_item_id: parentId, child_item_id: childId, qty_per: qty });
  });

  return { ok, errors };
}
