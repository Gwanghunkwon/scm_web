from datetime import date

from sqlalchemy.orm import Session

from models.inventory import Inventory
from models.item import Item


def test_mrp_calc_uses_safety_stock_and_leadtime(db_session: Session, client) -> None:
    """
    재고·안전재고·리드타임을 반영해 부족수량과 제안 발주일을 계산하는지 검증.
    """
    # given: 재고 20, 안전재고 10, 필요수량 25 → 가용 10 → 부족 15
    item = Item(
        code="FG-MRP",
        name="MRP 테스트 품목",
        type="PRODUCT",
        uom="EA",
        safety_stock_qty=10,
        lead_time_days=5,
        is_active=True,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    today = date.today()
    db_session.add(
        Inventory(
            item_id=item.id,
            warehouse_id=1,
            qty=20,
            as_of_date=today,
        )
    )
    db_session.commit()

    # when
    resp = client.post(
        "/api/mrp/calc",
        json={
            "item_id": item.id,
            "required_qty": 25,
            "required_date": today.isoformat(),
        },
    )

    # then
    assert resp.status_code == 200
    data = resp.json()
    assert data["on_hand_qty"] == 20
    assert data["safety_stock_qty"] == 10
    assert data["shortage_qty"] == 15

