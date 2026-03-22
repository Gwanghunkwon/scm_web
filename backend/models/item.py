from sqlalchemy import Boolean, Column, Integer, Numeric, String
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime

from core.database import Base


class Item(Base):
    __tablename__ = "item"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # PRODUCT / RAW
    uom = Column(String, nullable=False)
    unit_price = Column(Numeric, nullable=True)  # 원재료 단가(선택), 발주 비용 추정용
    safety_stock_qty = Column(Numeric, default=0)
    lead_time_days = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

