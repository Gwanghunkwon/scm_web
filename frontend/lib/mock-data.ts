import { DashboardResponse, MaterialRow, Period, Product } from "./types";

export const products: Product[] = [
  { id: "all", name: "All Products" },
  { id: "cookie", name: "Cookie Base Mix" },
  { id: "cake", name: "Cake Premix" },
];

export function buildMockDashboard(
  period: Period,
  productId: string
): DashboardResponse {
  // API 실패/로딩 중일 때 임의 숫자를 보여주지 않기 위해
  // "빈 대시보드" 형태로 폴백한다.
  const horizonMonths = period === "3M" ? 3 : period === "6M" ? 6 : 12;
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const forecast = Array.from({ length: horizonMonths }).map((_, idx) => ({
    month: monthNames[idx] ?? "",
    m3: 0,
    m6: 0,
    m12: 0,
  }));

  const emptyRows: MaterialRow[] = [];
  return {
    period,
    productId,
    kpis: {
      totalShortageMaterials: 0,
      totalRequiredProcurementQty: 0,
      estimatedProcurementCost: 0,
      mostCriticalMaterial: "None",
    },
    stockVsRequired: emptyRows,
    forecast,
  };
}
