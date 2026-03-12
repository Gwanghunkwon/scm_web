from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.lead_time import LeadTime
from schemas.lead_time import LeadTimeCreate, LeadTimeRead


router = APIRouter(prefix="/api/lead-times", tags=["lead_times"])


@router.get("", response_model=list[LeadTimeRead])
def list_lead_times(db: Session = Depends(get_db)):
    return db.query(LeadTime).all()


@router.post("", response_model=LeadTimeRead)
def create_lead_time(payload: LeadTimeCreate, db: Session = Depends(get_db)):
    lt = LeadTime(
        item_id=payload.item_id,
        vendor_name=payload.vendor_name,
        lead_time_days=payload.lead_time_days,
        min_order_qty=payload.min_order_qty,
    )
    db.add(lt)
    db.commit()
    db.refresh(lt)
    return lt


@router.get("/{lead_time_id}", response_model=LeadTimeRead)
def get_lead_time(lead_time_id: int, db: Session = Depends(get_db)):
    lt = db.query(LeadTime).get(lead_time_id)
    if not lt:
        raise HTTPException(status_code=404, detail="리드타임 정보를 찾을 수 없습니다.")
    return lt


@router.put("/{lead_time_id}", response_model=LeadTimeRead)
def update_lead_time(lead_time_id: int, payload: LeadTimeCreate, db: Session = Depends(get_db)):
    lt = db.query(LeadTime).get(lead_time_id)
    if not lt:
        raise HTTPException(status_code=404, detail="리드타임 정보를 찾을 수 없습니다.")

    lt.item_id = payload.item_id
    lt.vendor_name = payload.vendor_name
    lt.lead_time_days = payload.lead_time_days
    lt.min_order_qty = payload.min_order_qty

    db.commit()
    db.refresh(lt)
    return lt


@router.delete("/{lead_time_id}", status_code=204)
def delete_lead_time(lead_time_id: int, db: Session = Depends(get_db)):
    lt = db.query(LeadTime).get(lead_time_id)
    if not lt:
        raise HTTPException(status_code=404, detail="리드타임 정보를 찾을 수 없습니다.")
    db.delete(lt)
    db.commit()

