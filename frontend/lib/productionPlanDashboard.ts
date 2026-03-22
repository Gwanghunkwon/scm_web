import type { Period, ProductionPlanRecord } from "./types";

const HORIZON_MONTHS: Record<Period, number> = {
  "3M": 3,
  "6M": 6,
  "12M": 12,
};

/** 오늘 0시 기준 */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 대시보드 기간(3/6/12개월) 종료일 — 시작은 오늘 0시 */
export function horizonEndDate(period: Period): Date {
  const d = startOfToday();
  d.setMonth(d.getMonth() + HORIZON_MONTHS[period]);
  return d;
}

/**
 * 두 기간이 겹치는지 (날짜 문자열 YYYY-MM-DD)
 * 대시보드 창: [windowStart, windowEnd] 닫힌 구간으로 간주 (end는 마지막 날 포함)
 */
export function rangesOverlap(
  planStart: string,
  planEnd: string,
  windowStart: Date,
  windowEnd: Date
): boolean {
  const ps = new Date(planStart);
  const pe = new Date(planEnd);
  ps.setHours(0, 0, 0, 0);
  pe.setHours(0, 0, 0, 0);
  const ws = new Date(windowStart);
  const we = new Date(windowEnd);
  return !(pe < ws || ps > we);
}

/**
 * 선택 제품 + 대시보드 기간(오늘부터 N개월)과 겹치는 생산계획의 수량 합계.
 * (여러 건이 겹치면 모두 합산)
 */
export function sumPlannedQtyInHorizon(
  productId: number,
  period: Period,
  plans: ProductionPlanRecord[]
): number {
  const ws = startOfToday();
  const we = horizonEndDate(period);
  return plans
    .filter(
      (p) =>
        p.item_id === productId &&
        rangesOverlap(p.period_start, p.period_end, ws, we)
    )
    .reduce((acc, p) => acc + Number(p.quantity), 0);
}
