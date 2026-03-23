"use client";

import { useMemo, useState } from "react";

export default function ForecastPage() {
  const [product, setProduct] = useState("Chocolate Cake");
  const [rows] = useState([
    { week: 1, qty: 100 },
    { week: 2, qty: 120 },
    { week: 3, qty: 90 },
    { week: 4, qty: 110 },
  ]);

  const total = useMemo(() => rows.reduce((acc, r) => acc + r.qty, 0), [rows]);

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-3xl font-semibold">Demand Forecast</h1>
      <div className="rounded-2xl border bg-white p-4 shadow-soft">
        <label className="text-sm text-slate-600">Product selector</label>
        <input value={product} onChange={(e) => setProduct(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-2 text-left">Week</th>
              <th className="p-2 text-left">Forecast Qty</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.week} className="border-t">
                <td className="p-2">{r.week}</td>
                <td className="p-2">{r.qty}</td>
              </tr>
            ))}
            <tr className="border-t bg-slate-50 font-semibold">
              <td className="p-2">합계</td>
              <td className="p-2">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
