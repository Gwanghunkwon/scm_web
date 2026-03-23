from sqlalchemy import Column, Integer, Numeric, String
from sqlalchemy.types import Date

from core.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=False, index=True)
    warehouse_id = Column(Integer, nullable=False, index=True)
    qty = Column(Numeric, nullable=False, default=0)
    as_of_date = Column(Date, nullable=False)
    lot_no = Column(String, nullable=True)
    expiry_date = Column(Date, nullable=True)

