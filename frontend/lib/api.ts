import { buildMockDashboard } from "./mock-data";
import { DashboardResponse, Period } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function getDashboardData(
  period: Period,
  productId: string
): Promise<DashboardResponse> {
  try {
    const params = new URLSearchParams({ period, product_id: productId });
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
