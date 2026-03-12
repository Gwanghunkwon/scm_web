from sqlalchemy import Column, Integer, Numeric, String
from sqlalchemy.types import Date

from core.database import Base


class DemandForecast(Base):
    __tablename__ = "demand_forecast"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    quantity = Column(Numeric, nullable=False)
    method = Column(String, nullable=True)

