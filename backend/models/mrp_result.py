from sqlalchemy import Column, Integer, Numeric, String
from sqlalchemy.types import Date

from core.database import Base


class MrpResult(Base):
    __tablename__ = "mrp_result"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=False, index=True)
    required_qty = Column(Numeric, nullable=False)
    on_hand_qty = Column(Numeric, nullable=False)
    safety_stock_qty = Column(Numeric, nullable=False)
    shortage_qty = Column(Numeric, nullable=False)
    suggested_order_date = Column(Date, nullable=True)
    required_date = Column(Date, nullable=True)
    plan_version = Column(String, nullable=True)

