from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.warehouse import Warehouse
from schemas.warehouse import WarehouseCreate, WarehouseRead


router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])


@router.get("", response_model=list[WarehouseRead])
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()


@router.post("", response_model=WarehouseRead)
def create_warehouse(payload: WarehouseCreate, db: Session = Depends(get_db)):
    exists = db.query(Warehouse).filter(Warehouse.code == payload.code).first()
    if exists:
        raise HTTPException(status_code=400, detail="이미 존재하는 창고 코드입니다.")
    wh = Warehouse(
        code=payload.code,
        name=payload.name,
        warehouse_type=payload.warehouse_type,
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("/{warehouse_id}", response_model=WarehouseRead)
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    wh = db.query(Warehouse).get(warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="창고를 찾을 수 없습니다.")
    return wh


@router.put("/{warehouse_id}", response_model=WarehouseRead)
def update_warehouse(warehouse_id: int, payload: WarehouseCreate, db: Session = Depends(get_db)):
    wh = db.query(Warehouse).get(warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="창고를 찾을 수 없습니다.")

    if payload.code != wh.code:
        exists = db.query(Warehouse).filter(Warehouse.code == payload.code).first()
        if exists:
            raise HTTPException(status_code=400, detail="이미 존재하는 창고 코드입니다.")

    wh.code = payload.code
    wh.name = payload.name
    wh.warehouse_type = payload.warehouse_type

    db.commit()
    db.refresh(wh)
    return wh


@router.delete("/{warehouse_id}", status_code=204)
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    wh = db.query(Warehouse).get(warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="창고를 찾을 수 없습니다.")
    db.delete(wh)
    db.commit()

