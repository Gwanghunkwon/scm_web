from datetime import date

from pydantic import BaseModel


class InventoryBase(BaseModel):
    item_id: int
    warehouse_id: int
    qty: float
    as_of_date: date


class InventoryCreate(InventoryBase):
    pass


class InventoryRead(InventoryBase):
    id: int

    class Config:
        from_attributes = True

