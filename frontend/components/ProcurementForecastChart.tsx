"use client";

import { DashboardResponse } from "@/lib/types";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: DashboardResponse["forecast"];
};

export function ProcurementForecastChart({ data }: Props) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Order Forecast</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="m3" stroke="#2563eb" strokeWidth={2} dot={false} name="3 months" />
            <Line type="monotone" dataKey="m6" stroke="#f59e0b" strokeWidth={2} dot={false} name="6 months" />
            <Line type="monotone" dataKey="m12" stroke="#22c55e" strokeWidth={2} dot={false} name="1 year" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
