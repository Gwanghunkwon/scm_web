from __future__ import annotations

from datetime import date, timedelta
from math import ceil

from schemas.scm_schedule import (
    Generate52wRequest,
    ScmTodoEvent,
    WeekPlanRow,
)


def _ceil_to_moq(qty: float, moq: float | None) -> float:
    if moq is None or moq <= 0:
        return qty
    return float(ceil(qty / moq) * moq)


def generate_52week_plan(req: Generate52wRequest) -> tuple[list[WeekPlanRow], list[ScmTodoEvent]]:
    """
    52주 계획 생성 (안전재고 + MOQ + CAPA + 리드타임).

    단순/명확한 MVP 규칙:
    - 주차 수요 차감 후 projected_inventory가 safety_stock 아래면 생산 필요량 계산
    - MOQ 적용 후, 주 CAPA(일 CAPA * 7)로 분할 생산(overflow는 이후 주로 carry)
    - 생산 완료일(해당 주 종료일), 생산 시작일/발주일 역산
    - 주차별 계획 행 + todo 이벤트(order/start/finish) 반환
    """
    projected_inventory = float(req.current_inventory)
    plans: list[WeekPlanRow] = []
    todos: list[ScmTodoEvent] = []

    capa_weekly = None
    if req.production_capa_per_day is not None and req.production_capa_per_day > 0:
        capa_weekly = float(req.production_capa_per_day) * 7.0

    carry_production_need = 0.0

    for week in range(1, 53):
        demand = float(req.forecast_by_week.get(week, 0.0))
        projected_inventory -= demand

        production_qty = 0.0
        need = 0.0

        if projected_inventory < float(req.safety_stock):
            need = float(req.safety_stock) - projected_inventory

        need += carry_production_need
        carry_production_need = 0.0

        if need > 0:
            planned = _ceil_to_moq(need, req.moq)
            if capa_weekly is not None and planned > capa_weekly:
                production_qty = capa_weekly
                carry_production_need = planned - capa_weekly
            else:
                production_qty = planned

            projected_inventory += production_qty

            finish_date = req.start_date + timedelta(days=(week * 7) - 1)
            start_date = finish_date - timedelta(days=req.production_leadtime_days)
            order_date = start_date - timedelta(days=req.material_leadtime_days)

            todos.append(
                ScmTodoEvent(
                    type="order",
                    week=week,
                    date=order_date,
                    description=f"{req.product_name} 원재료 발주",
                )
            )
            todos.append(
                ScmTodoEvent(
                    type="production_start",
                    week=week,
                    date=start_date,
                    description=f"{req.product_name} 생산 시작",
                )
            )
            todos.append(
                ScmTodoEvent(
                    type="production_finish",
                    week=week,
                    date=finish_date,
                    description=f"{req.product_name} 생산 완료",
                )
            )

        plans.append(
            WeekPlanRow(
                week=week,
                demand=round(demand, 4),
                production=round(production_qty, 4),
                inventory=round(projected_inventory, 4),
                shortage_risk=projected_inventory < float(req.safety_stock),
            )
        )

    return plans, todos
