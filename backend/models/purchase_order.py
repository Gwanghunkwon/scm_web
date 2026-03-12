from sqlalchemy import Column, Integer, Numeric, String
from sqlalchemy.sql import func
from sqlalchemy.types import Date, DateTime

from core.database import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_order"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String, unique=True, index=True, nullable=False)
    vendor_name = Column(String, nullable=False)
    order_date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="REQUESTED")  # REQUESTED / ORDERED / RECEIVED
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_line"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, nullable=False, index=True)
    item_id = Column(Integer, nullable=False, index=True)
    order_qty = Column(Numeric, nullable=False)
    due_date = Column(Date, nullable=False)

