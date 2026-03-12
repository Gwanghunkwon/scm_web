from datetime import date

from pydantic import BaseModel


class PurchaseOrderBase(BaseModel):
    order_no: str
    vendor_name: str
    order_date: date
    status: str = "REQUESTED"


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderRead(PurchaseOrderBase):
    id: int

    class Config:
        from_attributes = True


class PurchaseOrderStatusUpdate(BaseModel):
    status: str


class PurchaseOrderLineBase(BaseModel):
    purchase_order_id: int
    item_id: int
    order_qty: float
    due_date: date


class PurchaseOrderLineCreate(PurchaseOrderLineBase):
    pass


class PurchaseOrderLineRead(PurchaseOrderLineBase):
    id: int

    class Config:
        from_attributes = True

