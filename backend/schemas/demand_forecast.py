from datetime import date

from pydantic import BaseModel


class DemandForecastBase(BaseModel):
    item_id: int
    period_start: date
    period_end: date
    quantity: float
    method: str | None = None


class DemandForecastCreate(DemandForecastBase):
    pass


class DemandForecastRead(DemandForecastBase):
    id: int

    class Config:
        from_attributes = True

