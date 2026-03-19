from __future__ import annotations

from datetime import date, timedelta
from typing import Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.database import get_db
from models.inventory import Inventory
from models.item import Item
from models.production_plan import ProductionPlan
from schemas.dashboard import (
    DashboardForecastRow,
    DashboardKpi,
    DashboardMaterialRow,
    DashboardResponse,
)
from services.mrp_service import explode_bom

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    period: str = Query(default="3M", pattern="^(3M|6M|12M)$"),
    product_id: str = Query(default="all"),
    db: Session = Depends(get_db),
):
    # period -> horizon months
    horizon_months = {"3M": 3, "6M": 6, "12M": 12}[period]

    # product_id: "all" | <number>
    product_id_int: int | None = None
    if product_id != "all":
        try:
            product_id_int = int(product_id)
        except ValueError:
            product_id_int = None

    # Use current month as horizon start (inclusive)
    start_date = date.today().replace(day=1)
    # end_date is exclusive (first day of month after horizon)
    end_date = (start_date.replace(day=28) + timedelta(days=4)).replace(
        day=1
    )  # next month first day
    for _ in range(horizon_months - 1):
        end_date = (end_date.replace(day=28) + timedelta(days=4)).replace(day=1)

    # 1) Aggregate required material quantities from confirmed production plans
    plans_q = db.query(ProductionPlan).filter(ProductionPlan.status == "CONFIRMED")
    if product_id_int is not None:
        plans_q = plans_q.filter(ProductionPlan.item_id == product_id_int)

    plans: List[ProductionPlan] = (
        plans_q.filter(ProductionPlan.period_start >= start_date)
        .filter(ProductionPlan.period_start < end_date)
        .all()
    )

    required_by_material: Dict[int, float] = {}
    required_by_month: List[Dict[int, float]] = [
        {} for _ in range(horizon_months)
    ]

    for plan in plans:
        month_index = (plan.period_start.year - start_date.year) * 12 + (plan.period_start.month - start_date.month)
        if month_index < 0 or month_index >= horizon_months:
            continue

        exploded = explode_bom(db, parent_item_id=plan.item_id, quantity=float(plan.quantity))
        for material_id, qty in exploded.items():
            # qty per BOM can include intermediate nodes; keep only items that exist in Item table
            required_by_material[material_id] = required_by_material.get(material_id, 0.0) + float(qty)
            required_by_month[month_index][material_id] = required_by_month[month_index].get(material_id, 0.0) + float(qty)

    if not required_by_material:
        # No confirmed plans -> return empty dashboard (no arbitrary mock numbers)
        return DashboardResponse(
            period=period,
            product_id=product_id,
            kpis=DashboardKpi(
                total_shortage_materials=0,
                total_required_procurement_qty=0.0,
                estimated_procurement_cost=0.0,
                most_critical_material="None",
            ),
            stock_vs_required=[],
            forecast=[],
        )

    # 2) Compute current on-hand (latest inventory snapshot per item, sum across warehouses)
    latest_dates_subq = (
        db.query(Inventory.item_id.label("item_id"), func.max(Inventory.as_of_date).label("max_date"))
        .filter(Inventory.item_id.in_(list(required_by_material.keys())))
        .group_by(Inventory.item_id)
        .subquery()
    )

    inv_latest = (
        db.query(
            Inventory.item_id.label("item_id"),
            func.coalesce(func.sum(Inventory.qty), 0).label("on_hand"),
        )
        .join(
            latest_dates_subq,
            (Inventory.item_id == latest_dates_subq.c.item_id)
            & (Inventory.as_of_date == latest_dates_subq.c.max_date),
        )
        .group_by(Inventory.item_id)
        .all()
    )

    on_hand_by_material: Dict[int, float] = {row.item_id: float(row.on_hand) for row in inv_latest}

    # 3) Load material item metadata
    items = db.query(Item).filter(Item.id.in_(list(required_by_material.keys()))).all()
    item_by_id: Dict[int, Item] = {i.id: i for i in items}

    rows: List[DashboardMaterialRow] = []
    total_procurement_qty = 0.0
    most_negative_shortage = None  # (shortage_qty, material_name)
    shortage_count = 0

    for material_id, required_qty in required_by_material.items():
        item = item_by_id.get(material_id)
        if not item:
            continue
        # 대시보드의 "자재/부족" 관점에서는 RAW 자재만 표시합니다.
        if item.type != "RAW":
            continue

        current_stock = on_hand_by_material.get(material_id, 0.0)
        safety = float(item.safety_stock_qty or 0)
        available_for_demand = max(current_stock - safety, 0.0)

        shortage_qty = round(available_for_demand - required_qty, 4)
        suggested_order_qty = round(max(required_qty - available_for_demand, 0.0), 4)

        if suggested_order_qty > 0:
            shortage_count += 1
        total_procurement_qty += suggested_order_qty

        if most_negative_shortage is None or shortage_qty < most_negative_shortage[0]:
            most_negative_shortage = (shortage_qty, item.name)

        rows.append(
            DashboardMaterialRow(
                material_id=str(material_id),
                material_name=item.name,
                current_stock=round(current_stock, 4),
                required_qty=round(float(required_qty), 4),
                shortage_qty=shortage_qty,
                suggested_order_qty=suggested_order_qty,
                unit=item.uom,
            )
        )

    most_critical = most_negative_shortage[1] if most_negative_shortage else "None"
    kpis = DashboardKpi(
        total_shortage_materials=shortage_count,
        total_required_procurement_qty=round(total_procurement_qty, 4),
        estimated_procurement_cost=0.0,  # cost not available in current schema
        most_critical_material=most_critical,
    )

    # 4) Procurement forecast per month (rolling sums over m3/m6/m12)
    month_starts: List[date] = []
    cursor = start_date
    for _ in range(horizon_months):
        month_starts.append(cursor)
        cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)

    procurement_need_by_month: List[float] = [0.0 for _ in range(horizon_months)]

    for idx in range(horizon_months):
        required_month = required_by_month[idx]
        total_need = 0.0
        for material_id, required_qty_month in required_month.items():
            item = item_by_id.get(material_id)
            if not item:
                continue
            if item.type != "RAW":
                continue
            current_stock = on_hand_by_material.get(material_id, 0.0)
            safety = float(item.safety_stock_qty or 0)
            available_for_demand = max(current_stock - safety, 0.0)
            suggested_order_qty = max(float(required_qty_month) - available_for_demand, 0.0)
            total_need += suggested_order_qty
        procurement_need_by_month[idx] = round(total_need, 4)

    def rolling_sum(i: int, window: int) -> float:
        start = max(0, i - (window - 1))
        return round(sum(procurement_need_by_month[start : i + 1]), 4)

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    forecast: List[DashboardForecastRow] = []
    for i in range(horizon_months):
        d = month_starts[i]
        forecast.append(
            DashboardForecastRow(
                month=month_names[d.month - 1],
                m3=rolling_sum(i, 3),
                m6=rolling_sum(i, 6),
                m12=rolling_sum(i, 12),
            )
        )

    return DashboardResponse(
        period=period,
        product_id=product_id,
        kpis=kpis,
        stock_vs_required=rows,
        forecast=forecast,
    )
