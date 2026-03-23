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
    # 비용/안전재고/발주 제약
    unit_price = Column(Numeric, nullable=True)  # 원재료 단가(선택)
    safety_stock_qty = Column(Numeric, default=0)
    moq = Column(Numeric, nullable=True)  # 최소 발주량 (RAW 중심)

    # 리드타임/CAPA
    lead_time_days = Column(Integer, default=0)  # 하위 호환용(legacy)
    production_leadtime_days = Column(Integer, nullable=True)
    material_leadtime_days = Column(Integer, nullable=True)
    production_capa_per_day = Column(Numeric, nullable=True)

    # 소비기한(일)
    shelf_life_days = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

