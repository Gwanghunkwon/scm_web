from pydantic import BaseModel, Field

from schemas.dashboard import DashboardForecastRow, DashboardKpi, DashboardMaterialRow


class ProductionPlanLine(BaseModel):
    product_id: int = Field(..., ge=1)
    planned_quantity: float = Field(
        ...,
        ge=0,
        description="선택 기간(3/6/12개월) 동안의 해당 제품 총 생산(판매) 계획 수량",
    )


class CalculateRequest(BaseModel):
    period: str = Field(
        ...,
        description="3m / 6m / 12m 또는 3M / 6M / 12M",
    )
    production_plan: list[ProductionPlanLine] = Field(
        ...,
        min_length=1,
        description="제품별 기간 총 생산 계획 (여러 제품 합산 가능)",
    )


class CalculateMaterialSimple(BaseModel):
    """스펙 예시 호환: shortage = required - stock (양수=부족, 음수=잉여)."""

    material_id: str
    name: str
    unit: str
    required: float
    stock: float
    shortage: float
    order: float


class CalculateResponse(BaseModel):
    period: str
    product_ids: str
    materials: list[CalculateMaterialSimple]
    kpis: DashboardKpi
    stock_vs_required: list[DashboardMaterialRow]
    forecast: list[DashboardForecastRow]
