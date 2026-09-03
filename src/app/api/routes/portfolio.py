"""Virtual Paper Portfolio & Regime Rebalancing API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request, status

from app.core.models import (
    BrokerOrderSheet,
    CompoundingRequest,
    CompoundingResponse,
    CreatePortfolioRequest,
    PortfolioState,
    RebalanceAlert,
)
from app.ml.portfolio.compounding_engine import generate_compounding_projection
from app.ml.simulation.service import PortfolioService

router = APIRouter(tags=["Virtual Paper Portfolio Simulator"])


def get_portfolio_service(request: Request) -> PortfolioService:
    """Retrieve PortfolioService instance from application state."""
    service: Optional[PortfolioService] = getattr(request.app.state, "portfolio_service", None)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PortfolioService is not initialized on the application state.",
        )
    return service


@router.post(
    "/portfolio/create",
    response_model=PortfolioState,
    summary="Activate basket into Virtual Paper Portfolio",
    description="Initializes a live mark-to-market virtual portfolio with initial capital and recommended/custom holdings.",
)
async def create_portfolio_endpoint(
    payload: CreatePortfolioRequest,
    request: Request,
) -> PortfolioState:
    """Create a new simulated portfolio."""
    service = get_portfolio_service(request)
    try:
        return service.create_portfolio(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get(
    "/portfolio/{portfolio_id}",
    response_model=PortfolioState,
    summary="Get live mark-to-market portfolio state",
)
async def get_portfolio_endpoint(
    portfolio_id: str,
    request: Request,
) -> PortfolioState:
    """Get refreshed portfolio valuation and benchmark performance."""
    service = get_portfolio_service(request)
    try:
        return service.get_portfolio(portfolio_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio with ID '{portfolio_id}' was not found.",
        )


@router.get(
    "/portfolio/{portfolio_id}/rebalance",
    response_model=RebalanceAlert,
    summary="Get Regime-Shift Rebalance diff recommendations",
)
async def get_rebalance_diff_endpoint(
    portfolio_id: str,
    request: Request,
) -> RebalanceAlert:
    """Evaluate if market regime shift requires rebalancing."""
    service = get_portfolio_service(request)
    try:
        return service.get_rebalance_diff(portfolio_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio with ID '{portfolio_id}' was not found.",
        )


@router.post(
    "/portfolio/{portfolio_id}/rebalance/apply",
    response_model=PortfolioState,
    summary="Apply recommended rebalance to portfolio holdings",
)
async def apply_rebalance_endpoint(
    portfolio_id: str,
    request: Request,
) -> PortfolioState:
    """Execute rebalancing and update portfolio state."""
    service = get_portfolio_service(request)
    try:
        return service.apply_rebalance(portfolio_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio with ID '{portfolio_id}' was not found.",
        )


@router.get(
    "/portfolio/{portfolio_id}/order-sheet",
    response_model=BrokerOrderSheet,
    summary="Generate 1-Click Broker Order Sheet (Zerodha CSV / Groww Text)",
)
async def get_order_sheet_endpoint(
    portfolio_id: str,
    request: Request,
) -> BrokerOrderSheet:
    """Export copyable order sheet."""
    service = get_portfolio_service(request)
    try:
        return service.get_order_sheet(portfolio_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio with ID '{portfolio_id}' was not found.",
        )


@router.post(
    "/portfolio/compounding",
    response_model=CompoundingResponse,
    summary="Calculate compounding wealth projections & GBM quantile cones",
    description="Computes future values for Lump Sum, monthly SIP, and annual Step-Up SIP alongside Geometric Brownian Motion (GBM) quantile cones and Compounding Tipping Point.",
)
async def calculate_compounding_endpoint(
    payload: CompoundingRequest,
    request: Request,
) -> CompoundingResponse:
    """Compute long-horizon compounding wealth projection and GBM uncertainty cones."""
    if payload.portfolio_id:
        service = get_portfolio_service(request)
        try:
            portfolio = service.get_portfolio(payload.portfolio_id)
            # If initial_lump_sum was not specified or is 0, seed with current portfolio valuation
            if payload.initial_lump_sum <= 0.0:
                payload.initial_lump_sum = portfolio.current_value

            # Adjust default expected return & vol according to portfolio's risk persona
            if payload.expected_return_pct == 12.0:
                persona_val = getattr(portfolio.risk_persona, "value", str(portfolio.risk_persona))
                if persona_val == "Conservative":
                    payload.expected_return_pct = 10.0
                    payload.annual_volatility_pct = 11.0
                elif persona_val == "Aggressive":
                    payload.expected_return_pct = 16.0
                    payload.annual_volatility_pct = 19.0
                else:
                    payload.expected_return_pct = 13.0
                    payload.annual_volatility_pct = 15.0
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Portfolio with ID '{payload.portfolio_id}' was not found.",
            )

    return generate_compounding_projection(payload)

