from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.dashboard import DashboardKpi, DashboardResponse
from services.scm_calculation import compute_dashboard_for_plans

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

    return compute_dashboard_for_plans(
        db,
        period,
        [(product_id_int, production_qty)],
        product_id_label=str(product_id_int),
    )
