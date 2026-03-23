"use client";

// MVP: plan 페이지 결과를 복붙/JSON 전달하기 전, 구조 확인용 기본 캘린더 테이블
export default function CalendarPage() {
  const rows = [
    { date: "2026-03-10", type: "order", desc: "원재료 발주" },
    { date: "2026-03-15", type: "production_start", desc: "생산 시작" },
    { date: "2026-03-20", type: "production_finish", desc: "생산 완료" },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">SCM 캘린더 To-Do</h1>
      <p className="text-sm text-slate-600">발주/생산 일정 이벤트를 날짜순으로 보여줍니다. (MVP 1차)</p>
      <div className="rounded-2xl border bg-white p-4 shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">날짜</th>
              <th className="p-2 text-left">유형</th>
              <th className="p-2 text-left">업무</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.date}-${i}`} className="border-t">
                <td className="p-2">{r.date}</td>
                <td className="p-2">{r.type}</td>
                <td className="p-2">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
