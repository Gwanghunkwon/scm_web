export function KpiStatCard({
  title,
  value,
  tone = "normal",
}: {
  title: string;
  value: string | number;
  tone?: "normal" | "danger" | "warning";
}) {
  const toneCls =
    tone === "danger"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="text-sm text-slate-500">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}
