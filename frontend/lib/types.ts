export type Period = "3M" | "6M" | "12M";

export type Product = {
  id: string;
  name: string;
};

export type MaterialRow = {
  materialId: string;
  materialName: string;
  currentStock: number;
  requiredQty: number;
  shortageQty: number;
  suggestedOrderQty: number;
  unit: string;
};

export type KpiData = {
  totalShortageMaterials: number;
  totalRequiredProcurementQty: number;
  estimatedProcurementCost: number;
  mostCriticalMaterial: string;
};

export type DashboardResponse = {
  period: Period;
  productId: string;
  kpis: KpiData;
  stockVsRequired: MaterialRow[];
  forecast: Array<{
    month: string;
    m3: number;
    m6: number;
    m12: number;
  }>;
};
