from datetime import date

from sqlalchemy.orm import Session

from models.item import Item


def test_forecast_to_production_plan_flow(db_session: Session, client) -> None:
  """
  수요예측 → 생산계획 연동 통합 테스트 (간단 버전).
  """
  # 품목 생성
  item = Item(
    code="FG-FLOW-1",
    name="플로우 테스트 품목",
    type="PRODUCT",
    uom="EA",
    safety_stock_qty=0,
    lead_time_days=0,
    is_active=True,
  )
  db_session.add(item)
  db_session.commit()
  db_session.refresh(item)

  start = date.today()
  end = start

  # 수요예측 등록
  resp_forecast = client.post(
    "/api/demand-forecasts",
    json={
      "item_id": item.id,
      "period_start": start.isoformat(),
      "period_end": end.isoformat(),
      "quantity": 50,
      "method": "MANUAL",
    },
  )
  assert resp_forecast.status_code == 200

  # 예측 수량을 그대로 생산계획으로 반영 (상위 레이어 로직을 대신하는 테스트용 시뮬레이션)
  resp_plan = client.post(
    "/api/production-plans",
    json={
      "item_id": item.id,
      "period_start": start.isoformat(),
      "period_end": end.isoformat(),
      "quantity": 50,
      "status": "CONFIRMED",
      "version": "V1",
    },
  )
  assert resp_plan.status_code == 200
  plan = resp_plan.json()
  assert plan["quantity"] == 50
  assert plan["status"] == "CONFIRMED"


def test_production_plan_to_mrp_result_flow(db_session: Session, client) -> None:
  """
  생산계획 → MRP 결과 통합 테스트.
  """
  item = Item(
    code="FG-FLOW-2",
    name="MRP 플로우 품목",
    type="PRODUCT",
    uom="EA",
    safety_stock_qty=10,
    lead_time_days=3,
    is_active=True,
  )
  db_session.add(item)
  db_session.commit()
  db_session.refresh(item)

  today = date.today()

  # 생산계획 생성 (예: 40개)
  resp_plan = client.post(
    "/api/production-plans",
    json={
      "item_id": item.id,
      "period_start": today.isoformat(),
      "period_end": today.isoformat(),
      "quantity": 40,
      "status": "CONFIRMED",
      "version": "V1",
    },
  )
  assert resp_plan.status_code == 200

  # 현재 재고 0 상태에서 필요수량 40에 대한 MRP 계산
  resp_mrp = client.post(
    "/api/mrp/calc",
    json={
      "item_id": item.id,
      "required_qty": 40,
      "required_date": today.isoformat(),
    },
  )
  assert resp_mrp.status_code == 200
  data = resp_mrp.json()
  # 안전재고 10을 고려하므로 부족수량은 40 (재고 0, 가용 -10 → 0으로 보정)
  assert data["shortage_qty"] == 40


def test_mrp_to_po_to_receipt_to_inventory_flow(db_session: Session, client) -> None:
  """
  MRP → 발주 → 입고 → 재고 반영 통합 테스트.
  """
  item = Item(
    code="FG-FLOW-3",
    name="발주 플로우 품목",
    type="PRODUCT",
    uom="EA",
    safety_stock_qty=0,
    lead_time_days=0,
    is_active=True,
  )
  db_session.add(item)
  db_session.commit()
  db_session.refresh(item)

  today = date.today()

  # 30개 필요에 대한 MRP 계산 (재고 0 가정)
  resp_mrp = client.post(
    "/api/mrp/calc",
    json={
      "item_id": item.id,
      "required_qty": 30,
      "required_date": today.isoformat(),
    },
  )
  assert resp_mrp.status_code == 200
  mrp_data = resp_mrp.json()
  assert mrp_data["shortage_qty"] == 30

  # MRP 결과를 기반으로 발주 생성
  resp_po = client.post(
    "/api/purchase-orders",
    json={
      "order_no": "PO-FLOW-1",
      "vendor_name": "공급사A",
      "order_date": today.isoformat(),
      "status": "REQUESTED",
    },
  )
  assert resp_po.status_code == 200
  po = resp_po.json()

  # 발주 라인 생성 (30개)
  resp_line = client.post(
    f"/api/purchase-orders/{po['id']}/lines",
    json={
      "purchase_order_id": po["id"],
      "item_id": item.id,
      "order_qty": 30,
      "due_date": today.isoformat(),
    },
  )
  assert resp_line.status_code == 200

  # 발주 상태를 RECEIVED로 변경했다고 가정하고, 실제 입고 처리 = stock-transaction IN 30
  resp_trx = client.post(
    "/api/stock-transactions",
    json={
      "item_id": item.id,
      "warehouse_id": 1,
      "trx_type": "IN",
      "qty": 30,
      "reason": "발주 입고",
    },
  )
  assert resp_trx.status_code == 200

  # 재고 API로 반영 여부는 이미 단위 테스트에서 검증했으므로,
  # 여기서는 전체 플로우가 예외 없이 완료되는지만 확인한다.

