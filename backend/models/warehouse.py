from sqlalchemy import Column, Integer, String
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime

from core.database import Base


class Warehouse(Base):
    __tablename__ = "warehouse"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    warehouse_type = Column(String, nullable=True)  # FACTORY / WAREHOUSE / STORE
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

