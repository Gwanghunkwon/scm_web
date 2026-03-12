from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.inventory import Inventory
from models.stock_transaction import StockTransaction
from schemas.stock_transaction import StockTransactionCreate, StockTransactionRead


router = APIRouter(prefix="/api/stock-transactions", tags=["stock_transactions"])


@router.get("", response_model=list[StockTransactionRead])
def list_stock_transactions(db: Session = Depends(get_db)):
    return db.query(StockTransaction).all()


@router.post("", response_model=StockTransactionRead)
def create_stock_transaction(payload: StockTransactionCreate, db: Session = Depends(get_db)):
    # 1) 입출고 이력 생성
    trx = StockTransaction(
        item_id=payload.item_id,
        warehouse_id=payload.warehouse_id,
        trx_type=payload.trx_type,
        qty=payload.qty,
        reason=payload.reason,
    )
    db.add(trx)

    # 2) 해당 품목/창고/오늘 기준 재고 스냅샷 업데이트
    today = date.today()
    inv = (
        db.query(Inventory)
        .filter(
            Inventory.item_id == payload.item_id,
            Inventory.warehouse_id == payload.warehouse_id,
            Inventory.as_of_date == today,
        )
        .first()
    )
    if not inv:
        inv = Inventory(
            item_id=payload.item_id,
            warehouse_id=payload.warehouse_id,
            qty=0,
            as_of_date=today,
        )
        db.add(inv)

    delta = payload.qty if payload.trx_type == "IN" else -payload.qty
    new_qty = float(inv.qty) + float(delta)
    if new_qty < 0:
        raise HTTPException(
            status_code=400,
            detail="입출고 후 재고가 음수가 될 수 없습니다.",
        )
    inv.qty = new_qty

    db.commit()
    db.refresh(trx)
    return trx


@router.get("/{trx_id}", response_model=StockTransactionRead)
def get_stock_transaction(trx_id: int, db: Session = Depends(get_db)):
    trx = db.query(StockTransaction).get(trx_id)
    if not trx:
        raise HTTPException(status_code=404, detail="입출고 이력을 찾을 수 없습니다.")
    return trx

