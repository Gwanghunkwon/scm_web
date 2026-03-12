from datetime import date

from pydantic import BaseModel


class ProductionPlanBase(BaseModel):
    item_id: int
    period_start: date
    period_end: date
    quantity: float
    status: str = "DRAFT"
    version: str | None = None


class ProductionPlanCreate(ProductionPlanBase):
    pass


class ProductionPlanRead(ProductionPlanBase):
    id: int

    class Config:
        from_attributes = True

