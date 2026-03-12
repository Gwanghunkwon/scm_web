from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.item import Item
from routers.auth_router import require_role
from schemas.item import ItemCreate, ItemRead


router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("", response_model=list[ItemRead])
def list_items(db: Session = Depends(get_db)):
    return db.query(Item).all()


@router.post("", response_model=ItemRead, dependencies=[Depends(require_role("ADMIN"))])
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


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")
    return item


@router.put(
    "/{item_id}",
    response_model=ItemRead,
    dependencies=[Depends(require_role("ADMIN"))],
)
def update_item(item_id: int, payload: ItemCreate, db: Session = Depends(get_db)):
    item = db.query(Item).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")

    # 코드 중복 체크 (자기 자신 제외)
    if payload.code != item.code:
        exists = db.query(Item).filter(Item.code == payload.code).first()
        if exists:
            raise HTTPException(status_code=400, detail="이미 존재하는 품목 코드입니다.")

    item.code = payload.code
    item.name = payload.name
    item.type = payload.type
    item.uom = payload.uom
    item.safety_stock_qty = payload.safety_stock_qty
    item.lead_time_days = payload.lead_time_days
    item.is_active = payload.is_active

    db.commit()
    db.refresh(item)
    return item


@router.delete(
    "/{item_id}",
    status_code=204,
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")
    db.delete(item)
    db.commit()

