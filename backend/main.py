from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import Base, engine
from routers import (
    auth_router,
    bom_router,
    demand_forecast_router,
    inventory_router,
    item_router,
    lead_time_router,
    mrp_router,
    production_plan_router,
    purchase_order_router,
    stock_transaction_router,
    warehouse_router,
)


def create_app() -> FastAPI:
    app = FastAPI(title="SCM Backend API")

    # CORS 설정
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 라우터 등록
    app.include_router(auth_router.router)
    app.include_router(item_router.router)
    app.include_router(warehouse_router.router)
    app.include_router(bom_router.router)
    app.include_router(lead_time_router.router)
    app.include_router(demand_forecast_router.router)
    app.include_router(production_plan_router.router)
    app.include_router(inventory_router.router)
    app.include_router(stock_transaction_router.router)
    app.include_router(mrp_router.router)
    app.include_router(purchase_order_router.router)

    return app


app = create_app()


@app.on_event("startup")
def on_startup():
    # 필요한 경우 여기서 테이블 생성 (초기 개발용)
    # 운영에서는 Alembic 마이그레이션으로 관리하는 것을 권장
    Base.metadata.create_all(bind=engine)

