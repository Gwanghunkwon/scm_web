from datetime import date

from pydantic import BaseModel


class MrpResultBase(BaseModel):
    item_id: int
    required_qty: float
    on_hand_qty: float
    safety_stock_qty: float
    shortage_qty: float
    suggested_order_date: date | None = None
    required_date: date | None = None
    plan_version: str | None = None


class MrpResultCreate(MrpResultBase):
    pass


class MrpCalcRequest(BaseModel):
    item_id: int
    required_qty: float
    required_date: date | None = None


class MrpResultRead(MrpResultBase):
    id: int

    class Config:
        from_attributes = True

