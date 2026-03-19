from pydantic import BaseModel


class DashboardKpi(BaseModel):
    total_shortage_materials: int
    total_required_procurement_qty: float
    estimated_procurement_cost: float
    most_critical_material: str


class DashboardMaterialRow(BaseModel):
    material_id: str
    material_name: str
    current_stock: float
    required_qty: float
    shortage_qty: float
    suggested_order_qty: float
    unit: str


class DashboardForecastRow(BaseModel):
    month: str
    m3: float
    m6: float
    m12: float


class DashboardResponse(BaseModel):
    period: str
    product_id: str
    kpis: DashboardKpi
    stock_vs_required: list[DashboardMaterialRow]
    forecast: list[DashboardForecastRow]
