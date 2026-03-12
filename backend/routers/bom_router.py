from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.bom import Bom
from schemas.bom import BomCreate, BomRead


router = APIRouter(prefix="/api/boms", tags=["boms"])


@router.get("", response_model=list[BomRead])
def list_boms(db: Session = Depends(get_db)):
    return db.query(Bom).all()


@router.post("", response_model=BomRead)
def create_bom(payload: BomCreate, db: Session = Depends(get_db)):
    bom = Bom(
        parent_item_id=payload.parent_item_id,
        child_item_id=payload.child_item_id,
        qty_per=payload.qty_per,
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
    )
    db.add(bom)
    db.commit()
    db.refresh(bom)
    return bom


@router.get("/{bom_id}", response_model=BomRead)
def get_bom(bom_id: int, db: Session = Depends(get_db)):
    bom = db.query(Bom).get(bom_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BOM을 찾을 수 없습니다.")
    return bom


@router.put("/{bom_id}", response_model=BomRead)
def update_bom(bom_id: int, payload: BomCreate, db: Session = Depends(get_db)):
    bom = db.query(Bom).get(bom_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BOM을 찾을 수 없습니다.")

    bom.parent_item_id = payload.parent_item_id
    bom.child_item_id = payload.child_item_id
    bom.qty_per = payload.qty_per
    bom.valid_from = payload.valid_from
    bom.valid_to = payload.valid_to

    db.commit()
    db.refresh(bom)
    return bom


@router.delete("/{bom_id}", status_code=204)
def delete_bom(bom_id: int, db: Session = Depends(get_db)):
    bom = db.query(Bom).get(bom_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BOM을 찾을 수 없습니다.")
    db.delete(bom)
    db.commit()

