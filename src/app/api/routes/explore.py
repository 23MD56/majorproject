"""Explore Tab REST API Routes for Stock Intelligence and Multi-Horizon Forecasts."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.core.models import (
    ExploreStockSummary,
    MultiHorizonGrowthForecast,
    StockIntelligenceProfile,
)
from app.ml.forecasting.service import ExploreService
from app.universe import is_valid_symbol, normalize_symbol

router = APIRouter(prefix="/explore", tags=["Explore & Stock Intelligence"])


def get_explore_service(request: Request) -> ExploreService:
    """Dependency provider for ExploreService attached to application state."""
    return request.app.state.explore_service


@router.get("/stocks", response_model=List[ExploreStockSummary])
def list_explore_stocks(
    sector: Optional[str] = Query(None, description="Filter stocks by sector name"),
    search: Optional[str] = Query(None, description="Search stocks by symbol or company name"),
    service: ExploreService = Depends(get_explore_service),
):
    """List all NIFTY 50 universe stocks with quotes, 6M growth projections, and regime suitability."""
    try:
        return service.list_explore_stocks(sector=sector, search=search)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list explore stocks: {str(e)}")


@router.get("/profile/{symbol}", response_model=StockIntelligenceProfile)
def get_stock_profile(
    symbol: str,
    service: ExploreService = Depends(get_explore_service),
):
    """Retrieve 360-degree Stock Intelligence Profile including multi-horizon forecast cones and factors."""
    canonical = normalize_symbol(symbol)
    if not is_valid_symbol(canonical):
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found in NIFTY 50 universe")

    try:
        return service.get_stock_profile(canonical)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate stock profile for '{symbol}': {str(e)}")


@router.get("/forecast/{symbol}", response_model=MultiHorizonGrowthForecast)
def get_growth_forecast(
    symbol: str,
    service: ExploreService = Depends(get_explore_service),
):
    """Retrieve multi-horizon probabilistic return cones (1M, 3M, 6M, 12M) with quantile percentiles."""
    canonical = normalize_symbol(symbol)
    if not is_valid_symbol(canonical):
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found in NIFTY 50 universe")

    try:
        return service.get_growth_forecast(canonical)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate growth forecast for '{symbol}': {str(e)}")
