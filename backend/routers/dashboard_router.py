from fastapi import APIRouter, Query

from schemas.dashboard import (
    DashboardForecastRow,
    DashboardKpi,
    DashboardMaterialRow,
    DashboardResponse,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    period: str = Query(default="3M", pattern="^(3M|6M|12M)$"),
    product_id: str = Query(default="all"),
):
    base_rows = [
        {"material_id": "sugar", "material_name": "Sugar", "current_stock": 5, "required_qty": 100},
        {"material_id": "flour", "material_name": "Flour", "current_stock": 20, "required_qty": 150},
        {"material_id": "cocoa", "material_name": "Cocoa", "current_stock": 15, "required_qty": 80},
        {"material_id": "butter", "material_name": "Butter", "current_stock": 35, "required_qty": 60},
        {"material_id": "eggs", "material_name": "Eggs", "current_stock": 50, "required_qty": 45},
    ]
    period_multiplier = {"3M": 1.0, "6M": 1.6, "12M": 2.4}[period]
    product_factor = 1.0 if product_id == "all" else (0.95 if product_id == "cookie" else 1.1)

    rows: list[DashboardMaterialRow] = []
    for row in base_rows:
        required_qty = round(row["required_qty"] * period_multiplier * product_factor, 2)
        current_stock = float(row["current_stock"])
        shortage_qty = round(current_stock - required_qty, 2)
        suggested_order_qty = max(required_qty - current_stock, 0)
        rows.append(
            DashboardMaterialRow(
                material_id=row["material_id"],
                material_name=row["material_name"],
                current_stock=current_stock,
                required_qty=required_qty,
                shortage_qty=shortage_qty,
                suggested_order_qty=suggested_order_qty,
                unit="kg",
            )
        )

    shortage_rows = [r for r in rows if r.shortage_qty < 0]
    most_critical = sorted(shortage_rows, key=lambda r: r.shortage_qty)[0].material_name if shortage_rows else "None"
    total_required_procurement_qty = round(sum(r.suggested_order_qty for r in rows), 2)
    kpis = DashboardKpi(
        total_shortage_materials=len(shortage_rows),
        total_required_procurement_qty=total_required_procurement_qty,
        estimated_procurement_cost=round(total_required_procurement_qty * 1200, 0),
        most_critical_material=most_critical,
    )

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    forecast_seed = [260, 430, 650, 590, 900, 820, 1030, 1010, 1180, 1140, 1260, 1330]
    limit = 6 if period == "3M" else (9 if period == "6M" else 12)
    forecast: list[DashboardForecastRow] = []
    for i in range(limit):
        value = forecast_seed[i]
        forecast.append(
            DashboardForecastRow(
                month=months[i],
                m3=round(value * 0.75, 2),
                m6=round(value * 0.9, 2),
                m12=round(value * 1.05, 2),
            )
        )

    return DashboardResponse(
        period=period,
        product_id=product_id,
        kpis=kpis,
        stock_vs_required=rows,
        forecast=forecast,
    )
