from pydantic import BaseModel


class WarehouseBase(BaseModel):
  code: str
  name: str
  warehouse_type: str | None = None


class WarehouseCreate(WarehouseBase):
  pass


class WarehouseRead(WarehouseBase):
  id: int

  class Config:
    from_attributes = True

