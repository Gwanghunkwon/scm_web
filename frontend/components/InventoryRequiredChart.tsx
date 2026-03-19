"use client";

import { MaterialRow } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  rows: MaterialRow[];
};

export function InventoryRequiredChart({ rows }: Props) {
  const chartData = rows.map((row) => ({
    name: row.materialName,
    currentStock: row.currentStock,
    requiredQty: row.requiredQty,
  }));

  if (chartData.length === 0) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="mb-2 text-base font-semibold text-slate-900">
          Current Stock vs Required Stock
        </h3>
        <p className="text-sm text-slate-500">데이터가 없습니다. (확정된 생산계획이 필요합니다.)</p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Current Stock vs Required Stock</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="currentStock" fill="#2563eb" radius={[8, 8, 0, 0]} />
            <Bar dataKey="requiredQty" fill="#6b7280" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
