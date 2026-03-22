"""
SCM MVP: BOM + 재고 기반 필요량/부족/발주량 계산 (대시보드 / POST calculate 공통).
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Dict, List, Sequence, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.inventory import Inventory
from models.item import Item
from schemas.dashboard import (
    DashboardForecastRow,
    DashboardKpi,
    DashboardMaterialRow,
    DashboardResponse,
)
from services.mrp_service import explode_bom


def normalize_period(period: str) -> str:
    p = period.strip().upper()
    if p in ("3M", "6M", "12M"):
        return p
    # accept 3m, 6m, 12m
    low = period.strip().lower()
    if low == "3m":
        return "3M"
    if low == "6m":
        return "6M"
    if low == "12m":
        return "12M"
    raise ValueError(f"지원하지 않는 period: {period}")


def compute_dashboard_for_plans(
    db: Session,
    period: str,
    plans: Sequence[Tuple[int, float]],
    *,
    product_id_label: str | None = None,
) -> DashboardResponse:
    """
    plans: (product_id, planned_quantity_for_whole_period) 목록.
    planned_quantity는 해당 period(3/6/12개월) 동안의 총 생산(판매) 계획 수량.
    """
    period_upper = normalize_period(period)
    horizon_months = {"3M": 3, "6M": 6, "12M": 12}[period_upper]

    valid_plans = [(int(pid), float(qty)) for pid, qty in plans if float(qty) > 0]
    if not valid_plans:
        label = product_id_label or "0"
        return DashboardResponse(
            period=period_upper,
            product_id=label,
            kpis=DashboardKpi(
                total_shortage_materials=0,
                total_required_procurement_qty=0.0,
                estimated_procurement_cost=0.0,
                most_critical_material="None",
            ),
            stock_vs_required=[],
            forecast=[],
        )

    merged: Dict[int, float] = defaultdict(float)
    for pid, qty in valid_plans:
        exploded = explode_bom(db, parent_item_id=pid, quantity=qty)
        for mid, q in exploded.items():
            merged[mid] += float(q)

    if not merged:
        label = product_id_label or ",".join(str(p[0]) for p in valid_plans)
        return DashboardResponse(
            period=period_upper,
            product_id=label,
            kpis=DashboardKpi(
                total_shortage_materials=0,
                total_required_procurement_qty=0.0,
                estimated_procurement_cost=0.0,
                most_critical_material="None",
            ),
            stock_vs_required=[],
            forecast=[],
        )

    items = db.query(Item).filter(Item.id.in_(list(merged.keys()))).all()
    item_by_id: Dict[int, Item] = {i.id: i for i in items}
    raw_ids = [
        mid
        for mid in merged.keys()
        if item_by_id.get(mid) is not None and item_by_id[mid].type == "RAW"
    ]

    if not raw_ids:
        label = product_id_label or ",".join(str(p[0]) for p in valid_plans)
        return DashboardResponse(
            period=period_upper,
            product_id=label,
            kpis=DashboardKpi(
                total_shortage_materials=0,
                total_required_procurement_qty=0.0,
                estimated_procurement_cost=0.0,
                most_critical_material="None",
            ),
            stock_vs_required=[],
            forecast=[],
        )

    required_selected_by_raw: Dict[int, float] = {
        rid: float(merged.get(rid, 0.0)) for rid in raw_ids
    }

    latest_dates_subq = (
        db.query(
            Inventory.item_id.label("item_id"),
            func.max(Inventory.as_of_date).label("max_date"),
        )
        .filter(Inventory.item_id.in_(raw_ids))
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
    on_hand_by_raw: Dict[int, float] = {
        row.item_id: float(row.on_hand) for row in inv_latest
    }

    production_monthly_factor = 1.0 / float(horizon_months)
    base_required_raw_per_unit_month: Dict[int, float] = {
        rid: required_selected_by_raw[rid] * production_monthly_factor for rid in raw_ids
    }

    rows: List[DashboardMaterialRow] = []
    total_order = 0.0
    total_cost = 0.0
    shortage_count = 0
    most_critical_shortage_qty = None

    for rid, required_qty in required_selected_by_raw.items():
        item = item_by_id[rid]
        current_stock = float(on_hand_by_raw.get(rid, 0.0))
        shortage_qty = round(current_stock - float(required_qty), 4)
        suggested_order_qty = round(max(float(required_qty) - current_stock, 0.0), 4)

        if suggested_order_qty > 0:
            shortage_count += 1
            if most_critical_shortage_qty is None or shortage_qty < most_critical_shortage_qty[0]:
                most_critical_shortage_qty = (shortage_qty, item.name)

        total_order += suggested_order_qty
        price = float(item.unit_price or 0) if getattr(item, "unit_price", None) is not None else 0.0
        total_cost += suggested_order_qty * price

        rows.append(
            DashboardMaterialRow(
                material_id=str(rid),
                material_name=item.name,
                current_stock=round(current_stock, 4),
                required_qty=round(float(required_qty), 4),
                shortage_qty=shortage_qty,
                suggested_order_qty=suggested_order_qty,
                unit=item.uom,
            )
        )

    most_critical = (
        most_critical_shortage_qty[1] if most_critical_shortage_qty is not None else "None"
    )

    kpis = DashboardKpi(
        total_shortage_materials=shortage_count,
        total_required_procurement_qty=round(total_order, 4),
        estimated_procurement_cost=round(total_cost, 2),
        most_critical_material=most_critical,
    )

    def add_months(d: date, months: int) -> date:
        y = d.year + (d.month - 1 + months) // 12
        m = (d.month - 1 + months) % 12 + 1
        return d.replace(year=y, month=m)

    forecast: List[DashboardForecastRow] = []
    start_month = date.today().replace(day=1)
    for i in range(12):
        d = add_months(start_month, i)
        t = i + 1

        def line_value(window_months: int) -> float:
            needed_cum = 0.0
            for rid in raw_ids:
                current_stock = float(on_hand_by_raw.get(rid, 0.0))
                required_cum_raw = base_required_raw_per_unit_month[rid] * min(t, window_months)
                needed_cum += max(required_cum_raw - current_stock, 0.0)
            return round(needed_cum, 4)

        forecast.append(
            DashboardForecastRow(
                month=f"{d.month}월",
                m3=line_value(3),
                m6=line_value(6),
                m12=line_value(12),
            )
        )

    pid_label = product_id_label
    if pid_label is None:
        if len(valid_plans) == 1:
            pid_label = str(valid_plans[0][0])
        else:
            pid_label = ",".join(str(p[0]) for p in valid_plans)

    return DashboardResponse(
        period=period_upper,
        product_id=pid_label,
        kpis=kpis,
        stock_vs_required=rows,
        forecast=forecast,
    )
