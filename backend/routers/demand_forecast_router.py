from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.demand_forecast import DemandForecast
from schemas.demand_forecast import DemandForecastCreate, DemandForecastRead


router = APIRouter(prefix="/api/demand-forecasts", tags=["demand_forecasts"])


@router.get("", response_model=list[DemandForecastRead])
def list_demand_forecasts(db: Session = Depends(get_db)):
    return db.query(DemandForecast).all()


@router.post("", response_model=DemandForecastRead)
def create_demand_forecast(payload: DemandForecastCreate, db: Session = Depends(get_db)):
    df = DemandForecast(
        item_id=payload.item_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        quantity=payload.quantity,
        method=payload.method,
    )
    db.add(df)
    db.commit()
    db.refresh(df)
    return df


@router.get("/{forecast_id}", response_model=DemandForecastRead)
def get_demand_forecast(forecast_id: int, db: Session = Depends(get_db)):
    df = db.query(DemandForecast).get(forecast_id)
    if not df:
        raise HTTPException(status_code=404, detail="수요예측을 찾을 수 없습니다.")
    return df


@router.put("/{forecast_id}", response_model=DemandForecastRead)
def update_demand_forecast(
    forecast_id: int,
    payload: DemandForecastCreate,
    db: Session = Depends(get_db),
):
    df = db.query(DemandForecast).get(forecast_id)
    if not df:
        raise HTTPException(status_code=404, detail="수요예측을 찾을 수 없습니다.")

    df.item_id = payload.item_id
    df.period_start = payload.period_start
    df.period_end = payload.period_end
    df.quantity = payload.quantity
    df.method = payload.method

    db.commit()
    db.refresh(df)
    return df


@router.delete("/{forecast_id}", status_code=204)
def delete_demand_forecast(forecast_id: int, db: Session = Depends(get_db)):
    df = db.query(DemandForecast).get(forecast_id)
    if not df:
        raise HTTPException(status_code=404, detail="수요예측을 찾을 수 없습니다.")
    db.delete(df)
    db.commit()

