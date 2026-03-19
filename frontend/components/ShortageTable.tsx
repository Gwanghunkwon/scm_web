"use client";

import { MaterialRow } from "@/lib/types";
import { useMemo, useState } from "react";

type Props = {
  rows: MaterialRow[];
  onRowClick: (row: MaterialRow) => void;
};

type SortKey = "materialName" | "currentStock" | "requiredQty" | "shortageQty" | "suggestedOrderQty";

export function ShortageTable({ rows, onRowClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("shortageQty");
  const [sortAsc, setSortAsc] = useState(true);

  const sortedRows = useMemo(() => {
    const copied = [...rows];
    copied.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (typeof left === "string" && typeof right === "string") {
        return sortAsc ? left.localeCompare(right) : right.localeCompare(left);
      }
      return sortAsc ? Number(left) - Number(right) : Number(right) - Number(left);
    });
    return copied;
  }, [rows, sortAsc, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
      return;
    }
    setSortKey(key);
    setSortAsc(true);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Top Shortages & Order Recommendations</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-3 py-2">
                <button type="button" onClick={() => toggleSort("materialName")}>Material</button>
              </th>
              <th className="px-3 py-2">
                <button type="button" onClick={() => toggleSort("currentStock")}>Current Stock</button>
              </th>
              <th className="px-3 py-2">
                <button type="button" onClick={() => toggleSort("requiredQty")}>Required Qty</button>
              </th>
              <th className="px-3 py-2">
                <button type="button" onClick={() => toggleSort("shortageQty")}>Shortage</button>
              </th>
              <th className="px-3 py-2">
                <button type="button" onClick={() => toggleSort("suggestedOrderQty")}>Order Suggestion</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isCritical = row.shortageQty < 0;
              return (
                <tr
                  key={row.materialId}
                  className={`cursor-pointer border-b border-slate-100 ${isCritical ? "bg-red-50/40" : ""}`}
                  onClick={() => onRowClick(row)}
                >
                  <td className="px-3 py-3 font-medium text-slate-800">{row.materialName}</td>
                  <td className="px-3 py-3">{row.currentStock.toLocaleString()} {row.unit}</td>
                  <td className="px-3 py-3">{row.requiredQty.toLocaleString()} {row.unit}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${
                        isCritical ? "bg-shortage text-white" : "bg-safe text-white"
                      }`}
                    >
                      {row.shortageQty.toLocaleString()} {row.unit}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      {row.suggestedOrderQty.toLocaleString()} {row.unit}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
