import { DashboardResponse, MaterialRow, Period, Product } from "./types";

export const products: Product[] = [
  { id: "all", name: "All Products" },
  { id: "cookie", name: "Cookie Base Mix" },
  { id: "cake", name: "Cake Premix" },
];

const baseRows: MaterialRow[] = [
  {
    materialId: "sugar",
    materialName: "Sugar",
    currentStock: 5,
    requiredQty: 100,
    shortageQty: -95,
    suggestedOrderQty: 95,
    unit: "kg",
  },
  {
    materialId: "flour",
    materialName: "Flour",
    currentStock: 20,
    requiredQty: 150,
    shortageQty: -130,
    suggestedOrderQty: 130,
    unit: "kg",
  },
  {
    materialId: "cocoa",
    materialName: "Cocoa",
    currentStock: 15,
    requiredQty: 80,
    shortageQty: -65,
    suggestedOrderQty: 65,
    unit: "kg",
  },
  {
    materialId: "butter",
    materialName: "Butter",
    currentStock: 35,
    requiredQty: 60,
    shortageQty: -25,
    suggestedOrderQty: 25,
    unit: "kg",
  },
  {
    materialId: "eggs",
    materialName: "Eggs",
    currentStock: 50,
    requiredQty: 45,
    shortageQty: 5,
    suggestedOrderQty: 0,
    unit: "kg",
  },
];

const periodMultiplier: Record<Period, number> = {
  "3M": 1,
  "6M": 1.6,
  "12M": 2.4,
};

export function buildMockDashboard(
  period: Period,
  productId: string
): DashboardResponse {
  const multiplier = periodMultiplier[period];
  const productFactor = productId === "all" ? 1 : productId === "cookie" ? 0.95 : 1.1;

  const rows = baseRows.map((row) => {
    const requiredQty = Math.round(row.requiredQty * multiplier * productFactor);
    const currentStock = row.currentStock;
    const shortageQty = currentStock - requiredQty;
    const suggestedOrderQty = Math.max(requiredQty - currentStock, 0);
    return {
      ...row,
      requiredQty,
      currentStock,
      shortageQty,
      suggestedOrderQty,
    };
  });

  const totalShortageMaterials = rows.filter((r) => r.shortageQty < 0).length;
  const totalRequiredProcurementQty = rows.reduce(
    (sum, r) => sum + r.suggestedOrderQty,
    0
  );
  const estimatedProcurementCost = totalRequiredProcurementQty * 1200;
  const mostCriticalMaterial =
    rows
      .filter((r) => r.shortageQty < 0)
      .sort((a, b) => a.shortageQty - b.shortageQty)[0]?.materialName ?? "None";

  const forecastBase = [260, 430, 650, 590, 900, 820, 1030, 1010, 1180, 1140, 1260, 1330];
  const activeMonths = period === "3M" ? 6 : period === "6M" ? 9 : 12;

  const forecast = forecastBase.slice(0, activeMonths).map((value, idx) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][idx],
    m3: Math.round(value * 0.75),
    m6: Math.round(value * 0.9),
    m12: Math.round(value * 1.05),
  }));

  return {
    period,
    productId,
    kpis: {
      totalShortageMaterials,
      totalRequiredProcurementQty,
      estimatedProcurementCost,
      mostCriticalMaterial,
    },
    stockVsRequired: rows,
    forecast,
  };
}
