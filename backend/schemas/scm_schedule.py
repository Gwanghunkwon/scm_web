from datetime import date

from pydantic import BaseModel, Field


class Generate52wRequest(BaseModel):
    product_id: int = Field(..., ge=1)
    product_name: str
    start_date: date

    current_inventory: float = 0
    safety_stock: float = 0
    moq: float | None = None

    production_leadtime_days: int = 0
    material_leadtime_days: int = 0
    production_capa_per_day: float | None = None

    # key: week(1~52), value: forecast quantity
    forecast_by_week: dict[int, float] = Field(default_factory=dict)


class WeekPlanRow(BaseModel):
    week: int
    demand: float
    production: float
    inventory: float
    shortage_risk: bool


class ScmTodoEvent(BaseModel):
    type: str  # order / production_start / production_finish
    week: int
    date: date
    description: str


class Generate52wResponse(BaseModel):
    product_id: int
    product_name: str
    plans: list[WeekPlanRow]
    todos: list[ScmTodoEvent]
