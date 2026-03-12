from pydantic import BaseModel


class WarehouseBase(BaseModel):
  code: str
  name: str


class WarehouseCreate(WarehouseBase):
  pass


class WarehouseRead(WarehouseBase):
  id: int

  class Config:
    from_attributes = True

