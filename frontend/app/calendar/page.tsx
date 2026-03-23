"use client";

export default function CalendarPage() {
  const rows = [
    { date: "03/10", type: "order", desc: "원재료 발주" },
    { date: "03/15", type: "production_start", desc: "생산 시작" },
    { date: "03/20", type: "production_finish", desc: "생산 완료" },
    { date: "03/22", type: "shipping", desc: "출고" },
  ];

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-3xl font-semibold">SCM Calendar</h1>
      <div className="rounded-2xl border bg-white p-4 shadow-soft">
        <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
          <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
        </div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={`${r.date}-${i}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span className="mr-3 font-semibold">{r.date}</span>
              <span className="mr-3 text-slate-500">{r.type}</span>
              <span>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
