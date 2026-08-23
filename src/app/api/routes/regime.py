"""Market Regime REST API Routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from app.core.models import CurrentRegimeResponse, RegimeHistoryResponse, RegimeTrainResponse
from app.ml.regime.service import RegimeService

router = APIRouter(prefix="/regime", tags=["Market Regime"])


def get_regime_service(request: Request) -> RegimeService:
    """Dependency provider for RegimeService attached to application state."""
    return request.app.state.regime_service


class TrainRegimeRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.get("/current", response_model=CurrentRegimeResponse)
def get_current_regime(
    service: RegimeService = Depends(get_regime_service),
):
    """Retrieve active macroeconomic market regime, confidence, and class probabilities."""
    try:
        return service.get_current_regime()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to infer current market regime: {str(e)}")


@router.get("/history", response_model=RegimeHistoryResponse)
def get_regime_history(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    service: RegimeService = Depends(get_regime_service),
):
    """Retrieve historical market regime classification timeline and overall regime distribution."""
    try:
        return service.get_regime_history(start_date=start_date, end_date=end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve regime history: {str(e)}")


@router.post("/train", response_model=RegimeTrainResponse)
def train_regime_model(
    payload: Optional[TrainRegimeRequest] = None,
    service: RegimeService = Depends(get_regime_service),
):
    """Trigger explicit training/fitting of the unsupervised regime classifier."""
    start = payload.start_date if payload else None
    end = payload.end_date if payload else None
    try:
        return service.train_model(start_date=start, end_date=end)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to train regime model: {str(e)}")
