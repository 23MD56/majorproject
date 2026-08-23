"""Quant Lab Technical Strategy Backtesting API endpoints."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query, Request, status

from app.core.models import (
    BacktestRequest,
    BacktestResponse,
    StrategyType,
)
from app.ml.backtest.service import BacktestService

router = APIRouter(tags=["Quant Lab Backtesting Studio"])


def get_backtest_service(request: Request) -> BacktestService:
    """Retrieve BacktestService instance from application state."""
    service: Optional[BacktestService] = getattr(request.app.state, "backtest_service", None)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="BacktestService is not initialized on the application state.",
        )
    return service


@router.post(
    "/backtest/run",
    response_model=BacktestResponse,
    summary="Execute Technical Strategy Backtest",
    description="Simulates technical trading strategies (Buy & Hold, MA Crossover, RSI, Bollinger Bands, Dual Momentum) on historical data with metrics and market regime attribution.",
)
async def run_backtest_post(
    payload: BacktestRequest,
    request: Request,
) -> BacktestResponse:
    """Run technical strategy backtest via POST body."""
    service = get_backtest_service(request)
    try:
        return service.run_backtest(
            symbol=payload.symbol,
            strategy=payload.strategy,
            start_date=payload.start_date,
            end_date=payload.end_date,
            initial_capital=payload.initial_capital,
            cost_bps=payload.cost_bps,
            slippage_bps=payload.slippage_bps,
            parameters=payload.parameters,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "/backtest/run",
    response_model=BacktestResponse,
    summary="Execute Technical Strategy Backtest (GET query parameters)",
)
async def run_backtest_get(
    request: Request,
    symbol: str = Query(default="^NSEI", description="NSE Symbol or Index"),
    strategy: StrategyType = Query(default=StrategyType.BUY_AND_HOLD, description="Strategy type"),
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    initial_capital: float = Query(default=100000.0, ge=1000.0, le=100000000.0, description="Initial capital in INR"),
    cost_bps: float = Query(default=5.0, ge=0.0, le=100.0, description="Cost basis points"),
    slippage_bps: float = Query(default=5.0, ge=0.0, le=100.0, description="Slippage basis points"),
) -> BacktestResponse:
    """Run technical strategy backtest via GET query params."""
    service = get_backtest_service(request)
    try:
        return service.run_backtest(
            symbol=symbol,
            strategy=strategy,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            cost_bps=cost_bps,
            slippage_bps=slippage_bps,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.post(
    "/quant-lab/backtest",
    response_model=BacktestResponse,
    summary="Alias for Quant Lab strategy backtest execution",
)
async def run_quant_lab_backtest_alias(
    payload: BacktestRequest,
    request: Request,
) -> BacktestResponse:
    """Alias for /backtest/run to support /quant-lab/backtest routing."""
    return await run_backtest_post(payload=payload, request=request)
