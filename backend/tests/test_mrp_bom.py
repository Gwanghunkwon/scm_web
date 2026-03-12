from sqlalchemy.orm import Session

from models.bom import Bom
from services.mrp_service import explode_bom


def test_explode_bom_simple(db_session: Session) -> None:
    """
    상위 제품 1개 생산 시 하위 자재 소요량이 올바르게 전개되는지 테스트.

    FG -> RM1(2개), RM2(3개)
    """
    # given
    fg_id = 100
    rm1_id = 200
    rm2_id = 300

    db_session.add(Bom(parent_item_id=fg_id, child_item_id=rm1_id, qty_per=2))
    db_session.add(Bom(parent_item_id=fg_id, child_item_id=rm2_id, qty_per=3))
    db_session.commit()

    # when
    requirements = explode_bom(db_session, parent_item_id=fg_id, quantity=1)

    # then
    assert requirements[rm1_id] == 2
    assert requirements[rm2_id] == 3

