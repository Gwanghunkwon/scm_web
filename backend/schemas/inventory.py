from datetime import date

from pydantic import BaseModel


class InventoryBase(BaseModel):
    item_id: int
    warehouse_id: int
    qty: float
    as_of_date: date
    lot_no: str | None = None
    expiry_date: date | None = None


class InventoryCreate(InventoryBase):
    pass


class InventoryRead(InventoryBase):
    id: int

    class Config:
        from_attributes = True

