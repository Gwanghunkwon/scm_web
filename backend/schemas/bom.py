from pydantic import BaseModel


class BomBase(BaseModel):
    parent_item_id: int
    child_item_id: int
    qty_per: float
    valid_from: int | None = None
    valid_to: int | None = None


class BomCreate(BomBase):
    pass


class BomRead(BomBase):
    id: int

    class Config:
        from_attributes = True

