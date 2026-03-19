from __future__ import annotations

from datetime import date
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.database import get_db
from models.inventory import Inventory
from models.item import Item
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
    production_qty: float = Query(default=0.0, ge=0.0),
    db: Session = Depends(get_db),
):
    """
    BOM(배합비)과 현재 재고를 기반으로 기간(3/6/12개월) 발주 계획을 산출한다.

    - 입력:
      - `product_id`: 제품(Item.type='PRODUCT') id
      - `production_qty`: 선택 기간 동안의 총 생산량(예: 3개월이면 3개월 총 생산량)
    - 계산:
      - 원재료 필요량 = (제품 생산량 × 배합비) → (재귀 BOM 전개)
      - 부족 수량 = 필요량 - 현재 재고
      - 발주량 = max(부족 수량, 0)
    - 대시보드 표시:
      - Bar: 재고 vs 필요량(선택 기간)
      - Line: 누적 발주량(3/6/12개월 라인)
    """

    horizon_months = {"3M": 3, "6M": 6, "12M": 12}[period]
    if product_id == "all":
        raise HTTPException(
            status_code=400,
            detail="product_id=all 은 지원하지 않습니다. 제품 id를 전달해 주세요.",
        )

    try:
        product_id_int = int(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="product_id 는 정수여야 합니다.")

    if production_qty <= 0:
        # 생산량이 없으면 대시보드 결과를 비워서(임의 숫자 금지) UI에서 입력을 유도한다.
        return DashboardResponse(
            period=period,
            product_id=str(product_id_int),
            kpis=DashboardKpi(
                total_shortage_materials=0,
                total_required_procurement_qty=0.0,
                estimated_procurement_cost=0.0,
                most_critical_material="None",
            ),
            stock_vs_required=[],
            forecast=[],
        )

    # 1) BOM 기준 "제품 1단위 생산" 시 원재료별 소요량(기저값)
    base_required_by_item: Dict[int, float] = explode_bom(
        db, parent_item_id=product_id_int, quantity=1.0
    )
    if not base_required_by_item:
        return DashboardResponse(
            period=period,
            product_id=str(product_id_int),
            kpis=DashboardKpi(
                total_shortage_materials=0,
                total_required_procurement_qty=0.0,
                estimated_procurement_cost=0.0,
                most_critical_material="None",
            ),
            stock_vs_required=[],
            forecast=[],
        )

    # 원재료(RAW)만 남기기 위해 타입 메타데이터 조회
    items = db.query(Item).filter(Item.id.in_(list(base_required_by_item.keys()))).all()
    item_by_id: Dict[int, Item] = {i.id: i for i in items}
    raw_ids = [
        item_id
        for item_id in base_required_by_item.keys()
        if item_by_id.get(item_id) is not None and item_by_id[item_id].type == "RAW"
    ]

    if not raw_ids:
        return DashboardResponse(
            period=period,
            product_id=str(product_id_int),
            kpis=DashboardKpi(
                total_shortage_materials=0,
                total_required_procurement_qty=0.0,
                estimated_procurement_cost=0.0,
                most_critical_material="None",
            ),
            stock_vs_required=[],
            forecast=[],
        )

    base_required_raw: Dict[int, float] = {
        rid: float(base_required_by_item.get(rid, 0.0)) for rid in raw_ids
    }

    # 2) 현재 재고: 각 원재료의 최신 스냅샷 날짜를 찾아 합산
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

    # 3) 선택 기간의 필요량 / 부족 / 발주량
    production_monthly = production_qty / float(horizon_months)
    required_selected_by_raw: Dict[int, float] = {
        rid: base_required_raw[rid] * production_qty for rid in raw_ids
    }

    rows: List[DashboardMaterialRow] = []
    total_required_procurement_qty = 0.0
    shortage_count = 0
    most_critical_shortage_qty = None  # (shortage_qty, name)

    for rid, required_qty in required_selected_by_raw.items():
        item = item_by_id[rid]
        current_stock = float(on_hand_by_raw.get(rid, 0.0))
        shortage_qty = round(current_stock - float(required_qty), 4)
        suggested_order_qty = round(
            max(float(required_qty) - current_stock, 0.0), 4
        )

        if suggested_order_qty > 0:
            shortage_count += 1
            if (
                most_critical_shortage_qty is None
                or shortage_qty < most_critical_shortage_qty[0]
            ):
                most_critical_shortage_qty = (shortage_qty, item.name)

        total_required_procurement_qty += suggested_order_qty

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
        most_critical_shortage_qty[1]
        if most_critical_shortage_qty is not None
        else "None"
    )

    kpis = DashboardKpi(
        total_shortage_materials=shortage_count,
        total_required_procurement_qty=round(total_required_procurement_qty, 4),
        estimated_procurement_cost=0.0,
        most_critical_material=most_critical,
    )

    # 4) 12개월 누적 발주량 라인 (3/6/12개월 윈도우)
    # month labels: 현재 월 포함 12개월
    def add_months(d: date, months: int) -> date:
        y = d.year + (d.month - 1 + months) // 12
        m = (d.month - 1 + months) % 12 + 1
        return d.replace(year=y, month=m)

    base_required_raw_per_unit = base_required_raw

    forecast: List[DashboardForecastRow] = []
    start_month = date.today().replace(day=1)
    for i in range(12):
        d = add_months(start_month, i)
        t = i + 1

        def line_value(window_months: int) -> float:
            needed_cum = 0.0
            for rid in raw_ids:
                current_stock = float(on_hand_by_raw.get(rid, 0.0))
                required_cum_raw = (
                    base_required_raw_per_unit[rid] * production_monthly * min(t, window_months)
                )
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

    return DashboardResponse(
        period=period,
        product_id=str(product_id_int),
        kpis=kpis,
        stock_vs_required=rows,
        forecast=forecast,
    )
