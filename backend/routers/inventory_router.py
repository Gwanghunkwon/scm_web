from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.inventory import Inventory
from schemas.inventory import InventoryCreate, InventoryRead


router = APIRouter(prefix="/api/inventories", tags=["inventories"])


@router.get("", response_model=list[InventoryRead])
def list_inventories(db: Session = Depends(get_db)):
    return db.query(Inventory).all()


@router.post("", response_model=InventoryRead)
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db)):
    # 같은 item_id/warehouse_id/as_of_date 조합이 이미 있으면 qty를 갱신한다.
    existing = (
        db.query(Inventory)
        .filter(
            Inventory.item_id == payload.item_id,
            Inventory.warehouse_id == payload.warehouse_id,
            Inventory.as_of_date == payload.as_of_date,
        )
        .first()
    )
    if existing:
        existing.qty = payload.qty
        db.commit()
        db.refresh(existing)
        return existing

    inv = Inventory(
        item_id=payload.item_id,
        warehouse_id=payload.warehouse_id,
        qty=payload.qty,
        as_of_date=payload.as_of_date,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("/{inventory_id}", response_model=InventoryRead)
def get_inventory(inventory_id: int, db: Session = Depends(get_db)):
    inv = db.query(Inventory).get(inventory_id)
    if not inv:
        raise HTTPException(status_code=404, detail="재고 스냅샷을 찾을 수 없습니다.")
    return inv

