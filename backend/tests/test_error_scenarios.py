from datetime import date

from sqlalchemy.orm import Session

from models.item import Item
from models.user import User


def test_mrp_with_missing_bom_and_no_leadtime_behaves_safely(
    db_session: Session, client
) -> None:
    """
    BOM이 없어도 explode-bom은 자기 자신 소요량으로 반환되고,
    리드타임이 없으면 제안발주일은 필요일과 동일해야 한다.
    """
    item = Item(
        code="ERR-MRP-001",
        name="BOM 누락/리드타임 미설정 테스트",
        type="PRODUCT",
        uom="EA",
        safety_stock_qty=0,
        lead_time_days=0,
        is_active=True,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    # BOM 누락 상태: 자기 자신 소요량으로 처리
    resp_bom = client.get(f"/api/mrp/explode-bom/{item.id}?qty=7")
    assert resp_bom.status_code == 200
    requirements = resp_bom.json()["requirements"]
    assert str(item.id) in requirements
    assert requirements[str(item.id)] == 7.0

    # 리드타임 미설정(0): suggested_order_date == required_date
    required_date = date.today().isoformat()
    resp_calc = client.post(
        "/api/mrp/calc",
        json={
            "item_id": item.id,
            "required_qty": 7,
            "required_date": required_date,
        },
    )
    assert resp_calc.status_code == 200
    data = resp_calc.json()
    assert data["suggested_order_date"] == required_date


def test_negative_inventory_is_blocked(client, db_session: Session) -> None:
    """
    출고로 재고가 음수가 되는 경우 400으로 차단되어야 한다.
    """
    item = Item(
        code="ERR-STK-001",
        name="음수재고 차단 테스트",
        type="RAW",
        uom="KG",
        safety_stock_qty=0,
        lead_time_days=0,
        is_active=True,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    resp = client.post(
        "/api/stock-transactions",
        json={
            "item_id": item.id,
            "warehouse_id": 1,
            "trx_type": "OUT",
            "qty": 99,
            "reason": "음수 재고 유발 시도",
        },
    )
    assert resp.status_code == 400
    assert "음수" in resp.text


def test_invalid_input_and_unauthorized_access(client, db_session: Session) -> None:
    """
    잘못된 입력값(422)과 권한 없는 접근(401/403)을 처리해야 한다.
    """
    # invalid input: 회원가입 email 형식 오류
    bad_register = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "name": "bad", "password": "password123"},
    )
    assert bad_register.status_code == 422

    # unauthorized access: ADMIN 권한 필요 API에 토큰 없이 접근
    no_auth = client.post(
        "/api/items",
        json={
            "code": "ERR-AUTH-001",
            "name": "권한 테스트",
            "type": "RAW",
            "uom": "EA",
            "safety_stock_qty": 0,
            "lead_time_days": 0,
            "is_active": True,
        },
    )
    assert no_auth.status_code in (401, 403)

    # 일반 USER 토큰으로도 ADMIN API 차단되는지 확인
    user = User(
        email="user-only@example.com",
        name="user",
        password_hash="dummy-hash",
        role="USER",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    from core.security import create_access_token

    token = create_access_token(subject=user.id)
    user_auth = client.post(
        "/api/items",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "code": "ERR-AUTH-002",
            "name": "권한 테스트2",
            "type": "RAW",
            "uom": "EA",
            "safety_stock_qty": 0,
            "lead_time_days": 0,
            "is_active": True,
        },
    )
    assert user_auth.status_code == 403

