from pydantic import BaseModel


class ItemBase(BaseModel):
    code: str
    name: str
    type: str
    uom: str
    unit_price: float | None = None
    safety_stock_qty: float | None = 0
    moq: float | None = None
    lead_time_days: int | None = 0
    production_leadtime_days: int | None = None
    material_leadtime_days: int | None = None
    production_capa_per_day: float | None = None
    shelf_life_days: int | None = None
    is_active: bool = True


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: int

    class Config:
        from_attributes = True

