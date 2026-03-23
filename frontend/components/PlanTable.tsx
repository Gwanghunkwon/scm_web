import type { ScmWeekPlanRow } from "@/lib/types";

export function PlanTable({ data }: { data: ScmWeekPlanRow[] }) {
  return (
    <div className="max-h-[520px] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-soft">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-slate-600">
          <tr>
            <th className="p-2 text-left">Week</th>
            <th className="p-2 text-left">Forecast</th>
            <th className="p-2 text-left">Production</th>
            <th className="p-2 text-left">Inventory</th>
            <th className="p-2 text-left">Order</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.week} className="border-t border-slate-100">
              <td className="p-2">{row.week}</td>
              <td className="p-2">{row.demand}</td>
              <td className="p-2">{row.production}</td>
              <td className="p-2">{row.inventory}</td>
              <td className="p-2">{row.shortage_risk ? "발주 필요" : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
