from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.production_plan import ProductionPlan
from schemas.production_plan import ProductionPlanCreate, ProductionPlanRead


router = APIRouter(prefix="/api/production-plans", tags=["production_plans"])


@router.get("", response_model=list[ProductionPlanRead])
def list_production_plans(db: Session = Depends(get_db)):
    return db.query(ProductionPlan).all()


@router.post("", response_model=ProductionPlanRead)
def create_production_plan(payload: ProductionPlanCreate, db: Session = Depends(get_db)):
    plan = ProductionPlan(
        item_id=payload.item_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        quantity=payload.quantity,
        status=payload.status,
        version=payload.version,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=ProductionPlanRead)
def get_production_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(ProductionPlan).get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="생산계획을 찾을 수 없습니다.")
    return plan


@router.put("/{plan_id}", response_model=ProductionPlanRead)
def update_production_plan(
    plan_id: int,
    payload: ProductionPlanCreate,
    db: Session = Depends(get_db),
):
    plan = db.query(ProductionPlan).get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="생산계획을 찾을 수 없습니다.")

    plan.item_id = payload.item_id
    plan.period_start = payload.period_start
    plan.period_end = payload.period_end
    plan.quantity = payload.quantity
    plan.status = payload.status
    plan.version = payload.version

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=204)
def delete_production_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(ProductionPlan).get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="생산계획을 찾을 수 없습니다.")
    db.delete(plan)
    db.commit()

