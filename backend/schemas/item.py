from pydantic import BaseModel


class ItemBase(BaseModel):
    code: str
    name: str
    type: str
    uom: str
    unit_price: float | None = None
    safety_stock_qty: float | None = 0
    lead_time_days: int | None = 0
    is_active: bool = True


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: int

    class Config:
        from_attributes = True

