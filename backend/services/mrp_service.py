from collections import defaultdict
from typing import Dict

from sqlalchemy.orm import Session

from models.bom import Bom


def explode_bom(db: Session, parent_item_id: int, quantity: float) -> Dict[int, float]:
    """
    단순 BOM 전개 함수.
    - parent_item_id 기준으로 하위 BOM을 재귀적으로 따라가며
      최종 자재별 소요량을 집계한다.
    - 같은 자재가 여러 경로에서 나와도 합산된다.
    """
    result: dict[int, float] = defaultdict(float)

    def _walk(item_id: int, required_qty: float) -> None:
        children = db.query(Bom).filter(Bom.parent_item_id == item_id).all()
        if not children:
            # 더 이상 하위 BOM이 없으면 최종 자재로 간주
            result[item_id] += required_qty
            return

        for line in children:
            child_required = float(line.qty_per) * required_qty
            _walk(line.child_item_id, child_required)

    _walk(parent_item_id, quantity)
    return dict(result)

