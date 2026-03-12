from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.item import Item
from schemas.item import ItemCreate, ItemRead


router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("", response_model=list[ItemRead])
def list_items(db: Session = Depends(get_db)):
    return db.query(Item).all()


@router.post("", response_model=ItemRead)
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    exists = db.query(Item).filter(Item.code == payload.code).first()
    if exists:
        raise HTTPException(status_code=400, detail="이미 존재하는 품목 코드입니다.")

    item = Item(
        code=payload.code,
        name=payload.name,
        type=payload.type,
        uom=payload.uom,
        safety_stock_qty=payload.safety_stock_qty,
        lead_time_days=payload.lead_time_days,
        is_active=payload.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

