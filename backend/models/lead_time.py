from sqlalchemy import Column, Integer, Numeric, String

from core.database import Base


class LeadTime(Base):
    __tablename__ = "lead_time"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=False, index=True)
    vendor_name = Column(String, nullable=False)
    lead_time_days = Column(Integer, nullable=False)
    min_order_qty = Column(Numeric, nullable=True)

