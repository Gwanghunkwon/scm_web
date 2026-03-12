from sqlalchemy import Column, Integer, Numeric

from core.database import Base


class Bom(Base):
    __tablename__ = "bom"

    id = Column(Integer, primary_key=True, index=True)
    parent_item_id = Column(Integer, nullable=False, index=True)
    child_item_id = Column(Integer, nullable=False, index=True)
    qty_per = Column(Numeric, nullable=False)
    valid_from = Column(Integer, nullable=True)  # YYYYMMDD 형태 등으로 단순 저장 (초기 버전)
    valid_to = Column(Integer, nullable=True)

