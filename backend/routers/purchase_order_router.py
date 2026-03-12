from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.purchase_order import PurchaseOrder, PurchaseOrderLine
from schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderLineCreate,
    PurchaseOrderLineRead,
    PurchaseOrderRead,
    PurchaseOrderStatusUpdate,
)


router = APIRouter(prefix="/api/purchase-orders", tags=["purchase_orders"])


@router.get("", response_model=list[PurchaseOrderRead])
def list_purchase_orders(db: Session = Depends(get_db)):
    return db.query(PurchaseOrder).all()


@router.post("", response_model=PurchaseOrderRead)
def create_purchase_order(payload: PurchaseOrderCreate, db: Session = Depends(get_db)):
    po = PurchaseOrder(
        order_no=payload.order_no,
        vendor_name=payload.vendor_name,
        order_date=payload.order_date,
        status=payload.status,
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    return po


@router.get("/{po_id}", response_model=PurchaseOrderRead)
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).get(po_id)
    if not po:
        raise HTTPException(status_code=404, detail="발주서를 찾을 수 없습니다.")
    return po


@router.patch("/{po_id}/status", response_model=PurchaseOrderRead)
def update_purchase_order_status(
    po_id: int,
    payload: PurchaseOrderStatusUpdate,
    db: Session = Depends(get_db),
):
    po = db.query(PurchaseOrder).get(po_id)
    if not po:
        raise HTTPException(status_code=404, detail="발주서를 찾을 수 없습니다.")

    po.status = payload.status
    db.commit()
    db.refresh(po)
    return po


@router.get("/{po_id}/lines", response_model=list[PurchaseOrderLineRead])
def list_purchase_order_lines(po_id: int, db: Session = Depends(get_db)):
    return db.query(PurchaseOrderLine).filter(PurchaseOrderLine.purchase_order_id == po_id).all()


@router.post("/{po_id}/lines", response_model=PurchaseOrderLineRead)
def create_purchase_order_line(
    po_id: int,
    payload: PurchaseOrderLineCreate,
    db: Session = Depends(get_db),
):
    # URL path의 po_id와 body의 purchase_order_id가 다르면 에러
    if payload.purchase_order_id != po_id:
        raise HTTPException(status_code=400, detail="발주 ID가 일치하지 않습니다.")

    line = PurchaseOrderLine(
        purchase_order_id=payload.purchase_order_id,
        item_id=payload.item_id,
        order_qty=payload.order_qty,
        due_date=payload.due_date,
    )
    db.add(line)
    db.commit()
    db.refresh(line)
    return line

