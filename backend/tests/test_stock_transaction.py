from datetime import date

from sqlalchemy.orm import Session

from models.inventory import Inventory
from models.item import Item


def test_stock_transaction_updates_inventory(db_session: Session, client) -> None:
    """
    입고/출고 등록 시 Inventory 스냅샷이 함께 업데이트되는지 검증.
    """
    item = Item(
        code="STK-001",
        name="재고 테스트 품목",
        type="RAW",
        uom="KG",
        safety_stock_qty=0,
        lead_time_days=0,
        is_active=True,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    # 초기 재고 0에서 10 입고
    resp_in = client.post(
        "/api/stock-transactions",
        json={
            "item_id": item.id,
            "warehouse_id": 1,
            "trx_type": "IN",
            "qty": 10,
            "reason": "초기 입고",
        },
    )
    assert resp_in.status_code == 200

    today = date.today()
    inv = (
        db_session.query(Inventory)
        .filter(
            Inventory.item_id == item.id,
            Inventory.warehouse_id == 1,
            Inventory.as_of_date == today,
        )
        .first()
    )
    assert inv is not None
    assert float(inv.qty) == 10

    # 5 출고 → 재고 5
    resp_out = client.post(
        "/api/stock-transactions",
        json={
            "item_id": item.id,
            "warehouse_id": 1,
            "trx_type": "OUT",
            "qty": 5,
            "reason": "테스트 출고",
        },
    )
    assert resp_out.status_code == 200

    inv = (
        db_session.query(Inventory)
        .filter(
            Inventory.item_id == item.id,
            Inventory.warehouse_id == 1,
            Inventory.as_of_date == today,
        )
        .first()
    )
    assert float(inv.qty) == 5


def test_stock_transaction_prevents_negative_inventory(db_session: Session, client) -> None:
    """
    출고로 인해 재고가 음수가 되려 하면 400 에러를 반환하는지 검증.
    """
    item = Item(
        code="STK-NEG",
        name="재고 음수 테스트",
        type="RAW",
        uom="KG",
        safety_stock_qty=0,
        lead_time_days=0,
        is_active=True,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    # 재고 0 상태에서 1 출고 시도 → 400
    resp = client.post(
        "/api/stock-transactions",
        json={
            "item_id": item.id,
            "warehouse_id": 1,
            "trx_type": "OUT",
            "qty": 1,
            "reason": "음수 재고 시도",
        },
    )
    assert resp.status_code == 400

