from sqlalchemy import Column, Integer, Numeric, String
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime

from core.database import Base


class StockTransaction(Base):
    __tablename__ = "stock_transaction"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=False, index=True)
    warehouse_id = Column(Integer, nullable=False, index=True)
    trx_type = Column(String, nullable=False)  # IN / OUT / ADJUST
    qty = Column(Numeric, nullable=False)
    reason = Column(String, nullable=True)
    trx_time = Column(DateTime(timezone=True), server_default=func.now())

