from sqlalchemy import Column, Integer, Numeric, String
from sqlalchemy.types import Date

from core.database import Base


class ProductionPlan(Base):
    __tablename__ = "production_plan"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    quantity = Column(Numeric, nullable=False)
    status = Column(String, nullable=False, default="DRAFT")  # DRAFT / CONFIRMED
    version = Column(String, nullable=True)

