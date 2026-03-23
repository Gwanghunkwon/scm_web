from fastapi import APIRouter

from schemas.scm_schedule import Generate52wRequest, Generate52wResponse
from services.scm_schedule_engine import generate_52week_plan

router = APIRouter(prefix="/api/scm", tags=["scm_schedule"])


@router.post("/generate-52w", response_model=Generate52wResponse)
def generate_52w(payload: Generate52wRequest):
    plans, todos = generate_52week_plan(payload)
    return Generate52wResponse(
        product_id=payload.product_id,
        product_name=payload.product_name,
        plans=plans,
        todos=todos,
    )
