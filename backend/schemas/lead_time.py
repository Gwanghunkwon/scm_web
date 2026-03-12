from pydantic import BaseModel


class LeadTimeBase(BaseModel):
    item_id: int
    vendor_name: str
    lead_time_days: int
    min_order_qty: float | None = None


class LeadTimeCreate(LeadTimeBase):
    pass


class LeadTimeRead(LeadTimeBase):
    id: int

    class Config:
        from_attributes = True

