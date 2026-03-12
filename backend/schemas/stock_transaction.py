from datetime import datetime

from pydantic import BaseModel


class StockTransactionBase(BaseModel):
    item_id: int
    warehouse_id: int
    trx_type: str  # IN / OUT / ADJUST
    qty: float
    reason: str | None = None


class StockTransactionCreate(StockTransactionBase):
    pass


class StockTransactionRead(StockTransactionBase):
    id: int
    trx_time: datetime

    class Config:
        from_attributes = True

