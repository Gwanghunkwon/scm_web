from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.database import get_db
from models.inventory import Inventory
from models.item import Item
from models.mrp_result import MrpResult
from schemas.mrp_result import MrpCalcRequest, MrpResultCreate, MrpResultRead
from services.mrp_service import explode_bom


router = APIRouter(prefix="/api/mrp", tags=["mrp"])


@router.get("/results", response_model=list[MrpResultRead])
def list_mrp_results(db: Session = Depends(get_db)):
    return db.query(MrpResult).all()


@router.post("/run", response_model=MrpResultRead)
def run_mrp(payload: MrpResultCreate, db: Session = Depends(get_db)):
    """
    간단한 MRP 실행 더미 엔드포인트.
    전달받은 수량/재고 정보를 그대로 결과 테이블에 저장한다.
    """
    result = MrpResult(
        item_id=payload.item_id,
        required_qty=payload.required_qty,
        on_hand_qty=payload.on_hand_qty,
        safety_stock_qty=payload.safety_stock_qty,
        shortage_qty=payload.shortage_qty,
        suggested_order_date=payload.suggested_order_date,
        required_date=payload.required_date,
        plan_version=payload.plan_version,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.post("/calc", response_model=MrpResultRead)
def calculate_mrp(payload: MrpCalcRequest, db: Session = Depends(get_db)):
    """
    재고·안전재고·리드타임을 반영한 간단 MRP 로직.
    - item.safety_stock_qty, item.lead_time_days, inventory 합계를 사용해 부족수량과 제안 발주일을 계산한다.
    """
    item = db.query(Item).get(payload.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")

    # 현재 재고 합계 (모든 창고 기준, 가장 최신 스냅샷)
    subq = (
        db.query(
            Inventory.item_id,
            Inventory.warehouse_id,
            Inventory.as_of_date,
            Inventory.qty,
        )
        .filter(Inventory.item_id == payload.item_id)
        .subquery()
    )
    # 단순 합산
    on_hand = db.query(func.coalesce(func.sum(subq.c.qty), 0)).scalar() or 0

    safety = float(item.safety_stock_qty or 0)
    required = payload.required_qty
    available_for_demand = max(on_hand - safety, 0)
    shortage = max(required - available_for_demand, 0)

    # 리드타임 기준 제안 발주일 계산
    lead_time_days = int(item.lead_time_days or 0)
    required_date = payload.required_date or date.today()
    suggested_order_date = required_date
    if lead_time_days > 0:
        suggested_order_date = required_date - timedelta(days=lead_time_days)

    result = MrpResult(
        item_id=item.id,
        required_qty=required,
        on_hand_qty=on_hand,
        safety_stock_qty=safety,
        shortage_qty=shortage,
        suggested_order_date=suggested_order_date,
        required_date=required_date,
        plan_version=None,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.get("/explode-bom/{item_id}")
def get_bom_explosion(item_id: int, qty: float = 1.0, db: Session = Depends(get_db)):
    """
    BOM 전개 및 자재 소요량 계산.
    - item_id 기준으로 qty 만큼 생산할 때 필요한 최종 자재별 소요량을 반환한다.
    """
    exploded = explode_bom(db, parent_item_id=item_id, quantity=qty)
    return {"item_id": item_id, "quantity": qty, "requirements": exploded}

