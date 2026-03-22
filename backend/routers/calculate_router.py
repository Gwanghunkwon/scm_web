from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.calculate import (
    CalculateMaterialSimple,
    CalculateRequest,
    CalculateResponse,
)
from services.scm_calculation import compute_dashboard_for_plans, normalize_period

router = APIRouter(prefix="/api/calculate", tags=["calculate"])


@router.post("", response_model=CalculateResponse)
def post_calculate(payload: CalculateRequest, db: Session = Depends(get_db)):
    """
    BOM + 재고 기반 필요량/부족/발주량 계산 (다제품 생산계획 합산).

    - 배합비가 없는 제품은 explode 결과가 비어 기여하지 않음(스펙: 계산 제외).
    - 재고 미등록 원재료는 재고 0으로 처리.
    """
    try:
        normalize_period(payload.period)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    plans = [(p.product_id, p.planned_quantity) for p in payload.production_plan]
    dash = compute_dashboard_for_plans(db, payload.period, plans)

    materials: list[CalculateMaterialSimple] = []
    for row in dash.stock_vs_required:
        req = float(row.required_qty)
        st = float(row.current_stock)
        deficit = round(req - st, 4)
        materials.append(
            CalculateMaterialSimple(
                material_id=row.material_id,
                name=row.material_name,
                unit=row.unit,
                required=row.required_qty,
                stock=row.current_stock,
                shortage=deficit,
                order=row.suggested_order_qty,
            )
        )

    return CalculateResponse(
        period=dash.period,
        product_ids=dash.product_id,
        materials=materials,
        kpis=dash.kpis,
        stock_vs_required=dash.stock_vs_required,
        forecast=dash.forecast,
    )
