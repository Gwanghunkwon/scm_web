import { buildMockDashboard } from "./mock-data";
import {
  BomRecord,
  CalculateResponse,
  DashboardResponse,
  InventoryRecord,
  Item,
  ItemCreatePayload,
  Period,
  ProductionPlanRecord,
  Warehouse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function getDashboardData(
  period: Period,
  productId: string,
  productionQty: number
): Promise<DashboardResponse> {
  try {
    const params = new URLSearchParams({
      period,
      product_id: productId,
      production_qty: String(productionQty),
    });
    const res = await fetch(`${API_BASE_URL}/api/dashboard?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Dashboard API error: ${res.status}`);
    }
    const raw = (await res.json()) as {
      period: Period;
      product_id: string;
      kpis: {
        total_shortage_materials: number;
        total_required_procurement_qty: number;
        estimated_procurement_cost: number;
        most_critical_material: string;
      };
      stock_vs_required: Array<{
        material_id: string;
        material_name: string;
        current_stock: number;
        required_qty: number;
        shortage_qty: number;
        suggested_order_qty: number;
        unit: string;
      }>;
      forecast: Array<{ month: string; m3: number; m6: number; m12: number }>;
    };

    return {
      period: raw.period,
      productId: raw.product_id,
      kpis: {
        totalShortageMaterials: raw.kpis.total_shortage_materials,
        totalRequiredProcurementQty: raw.kpis.total_required_procurement_qty,
        estimatedProcurementCost: raw.kpis.estimated_procurement_cost,
        mostCriticalMaterial: raw.kpis.most_critical_material,
      },
      stockVsRequired: raw.stock_vs_required.map((row) => ({
        materialId: row.material_id,
        materialName: row.material_name,
        currentStock: row.current_stock,
        requiredQty: row.required_qty,
        shortageQty: row.shortage_qty,
        suggestedOrderQty: row.suggested_order_qty,
        unit: row.unit,
      })),
      forecast: raw.forecast,
    };
  } catch {
    return buildMockDashboard(period, productId);
  }
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${API_BASE_URL}/api/items`, { cache: "no-store" });
  if (!res.ok) throw new Error("품목 목록을 가져오지 못했습니다.");
  return (await res.json()) as Item[];
}

async function parseError(res: Response): Promise<string> {
  const t = await res.text();
  try {
    const j = JSON.parse(t) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) return JSON.stringify(j.detail);
  } catch {
    /* ignore */
  }
  return t || `HTTP ${res.status}`;
}

export async function createItem(payload: ItemCreatePayload): Promise<Item> {
  const res = await fetch(`${API_BASE_URL}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: payload.code,
      name: payload.name,
      type: payload.type,
      uom: payload.uom,
      unit_price: payload.unit_price ?? null,
      safety_stock_qty: payload.safety_stock_qty ?? 0,
      lead_time_days: payload.lead_time_days ?? 0,
      is_active: payload.is_active ?? true,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as Item;
}

export async function deleteItem(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/items/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await fetch(`${API_BASE_URL}/api/warehouses`, { cache: "no-store" });
  if (!res.ok) throw new Error("창고 목록을 가져오지 못했습니다.");
  return (await res.json()) as Warehouse[];
}

export async function createWarehouse(input: {
  code: string;
  name: string;
}): Promise<Warehouse> {
  const res = await fetch(`${API_BASE_URL}/api/warehouses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as Warehouse;
}

export async function deleteWarehouse(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/warehouses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function fetchBoms(): Promise<BomRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/boms`, { cache: "no-store" });
  if (!res.ok) throw new Error("BOM 목록을 가져오지 못했습니다.");
  return (await res.json()) as BomRecord[];
}

export async function createBom(input: {
  parent_item_id: number;
  child_item_id: number;
  qty_per: number;
  valid_from?: number | null;
  valid_to?: number | null;
}): Promise<BomRecord> {
  const res = await fetch(`${API_BASE_URL}/api/boms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parent_item_id: input.parent_item_id,
      child_item_id: input.child_item_id,
      qty_per: input.qty_per,
      valid_from: input.valid_from ?? null,
      valid_to: input.valid_to ?? null,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as BomRecord;
}

export async function deleteBom(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/boms/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function fetchInventories(): Promise<InventoryRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/inventories`, { cache: "no-store" });
  if (!res.ok) throw new Error("재고 목록을 가져오지 못했습니다.");
  return (await res.json()) as InventoryRecord[];
}

export async function createInventory(input: {
  item_id: number;
  warehouse_id: number;
  qty: number;
  as_of_date: string;
}): Promise<InventoryRecord> {
  const res = await fetch(`${API_BASE_URL}/api/inventories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as InventoryRecord;
}

export async function fetchProductionPlans(): Promise<ProductionPlanRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/production-plans`, { cache: "no-store" });
  if (!res.ok) throw new Error("생산계획을 가져오지 못했습니다.");
  return (await res.json()) as ProductionPlanRecord[];
}

export async function createProductionPlan(input: {
  item_id: number;
  period_start: string;
  period_end: string;
  quantity: number;
  status?: string;
  version?: string | null;
}): Promise<ProductionPlanRecord> {
  const res = await fetch(`${API_BASE_URL}/api/production-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      item_id: input.item_id,
      period_start: input.period_start,
      period_end: input.period_end,
      quantity: input.quantity,
      status: input.status ?? "DRAFT",
      version: input.version ?? null,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as ProductionPlanRecord;
}

export async function deleteProductionPlan(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/production-plans/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export type CalculatePlanLine = { product_id: number; planned_quantity: number };

/** 다제품 생산계획 합산 계산 (BOM + 재고). period: 3M 또는 3m 등 */
export async function postCalculate(
  period: string,
  productionPlan: CalculatePlanLine[]
): Promise<CalculateResponse> {
  const res = await fetch(`${API_BASE_URL}/api/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ period, production_plan: productionPlan }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Calculate API error: ${res.status}`);
  }
  const raw = (await res.json()) as {
    period: Period;
    product_ids: string;
    materials: Array<{
      material_id: string;
      name: string;
      unit: string;
      required: number;
      stock: number;
      shortage: number;
      order: number;
    }>;
    kpis: {
      total_shortage_materials: number;
      total_required_procurement_qty: number;
      estimated_procurement_cost: number;
      most_critical_material: string;
    };
    stock_vs_required: Array<{
      material_id: string;
      material_name: string;
      current_stock: number;
      required_qty: number;
      shortage_qty: number;
      suggested_order_qty: number;
      unit: string;
    }>;
    forecast: DashboardResponse["forecast"];
  };

  return {
    period: raw.period,
    productIds: raw.product_ids,
    materials: raw.materials.map((m) => ({
      material_id: m.material_id,
      name: m.name,
      unit: m.unit,
      required: m.required,
      stock: m.stock,
      shortage: m.shortage,
      order: m.order,
    })),
    kpis: {
      totalShortageMaterials: raw.kpis.total_shortage_materials,
      totalRequiredProcurementQty: raw.kpis.total_required_procurement_qty,
      estimatedProcurementCost: raw.kpis.estimated_procurement_cost,
      mostCriticalMaterial: raw.kpis.most_critical_material,
    },
    stockVsRequired: raw.stock_vs_required.map((row) => ({
      materialId: row.material_id,
      materialName: row.material_name,
      currentStock: row.current_stock,
      requiredQty: row.required_qty,
      shortageQty: row.shortage_qty,
      suggestedOrderQty: row.suggested_order_qty,
      unit: row.unit,
    })),
    forecast: raw.forecast,
  };
}
