export type Period = "3M" | "6M" | "12M";

export type Product = {
  id: string;
  name: string;
};

export type Item = {
  id: number;
  code: string;
  name: string;
  type: string; // PRODUCT / RAW
  uom: string;
  unit_price?: number | null;
  safety_stock_qty?: number | null;
  lead_time_days?: number | null;
  is_active?: boolean | null;
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

/** POST /api/calculate 응답 (스펙 + 대시보드 동일 구조) */
export type CalculateMaterialSimple = {
  material_id: string;
  name: string;
  unit: string;
  required: number;
  stock: number;
  shortage: number;
  order: number;
};

export type CalculateResponse = {
  period: Period;
  productIds: string;
  materials: CalculateMaterialSimple[];
  kpis: KpiData;
  stockVsRequired: MaterialRow[];
  forecast: DashboardResponse["forecast"];
};

/** 품목 생성 API 페이로드 */
export type ItemCreatePayload = {
  code: string;
  name: string;
  type: string;
  uom: string;
  unit_price?: number | null;
  safety_stock_qty?: number | null;
  lead_time_days?: number | null;
  is_active?: boolean;
};

export type Warehouse = {
  id: number;
  code: string;
  name: string;
};

export type BomRecord = {
  id: number;
  parent_item_id: number;
  child_item_id: number;
  qty_per: number;
  valid_from: number | null;
  valid_to: number | null;
};

export type InventoryRecord = {
  id: number;
  item_id: number;
  warehouse_id: number;
  qty: number;
  as_of_date: string;
};

export type ProductionPlanRecord = {
  id: number;
  item_id: number;
  period_start: string;
  period_end: string;
  quantity: number;
  status: string;
  version: string | null;
};
