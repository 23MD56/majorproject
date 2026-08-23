"""Grow and AI Portfolio Basket recommendation API endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request, status

from app.core.models import (
    BasketRecommendationRequest,
    BasketRecommendationResponse,
    RiskPersona,
)
from app.ml.portfolio.service import GrowService

router = APIRouter(tags=["Grow & Portfolio Baskets"])


def get_grow_service(request: Request) -> GrowService:
    """Retrieve GrowService instance from application state."""
    service: Optional[GrowService] = getattr(request.app.state, "grow_service", None)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GrowService is not initialized on the application state.",
        )
    return service


@router.post(
    "/grow/recommend",
    response_model=BasketRecommendationResponse,
    summary="Generate AI Portfolio Basket recommendation",
    description="Optimizes NIFTY 50 blue-chip asset allocation using Regime-Aware Hierarchical Risk Parity and returns 3-tier Rupee growth scenarios with the 4-Pillar Trust Card.",
)
async def recommend_basket_post(
    payload: BasketRecommendationRequest,
    request: Request,
) -> BasketRecommendationResponse:
    """Generate curated AI portfolio basket via POST body."""
    service = get_grow_service(request)
    try:
        return service.recommend_basket(
            capital=payload.capital,
            horizon=payload.horizon,
            risk_persona=payload.risk_persona,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "/grow/recommend",
    response_model=BasketRecommendationResponse,
    summary="Generate AI Portfolio Basket recommendation (GET query parameters)",
)
async def recommend_basket_get(
    request: Request,
    capital: float = Query(default=50000.0, ge=1000.0, le=10000000.0, description="Investment capital in INR"),
    horizon: str = Query(default="6M", pattern="^(1M|3M|6M|12M)$", description="Investment horizon"),
    risk_persona: RiskPersona = Query(default=RiskPersona.BALANCED, description="Investor risk persona"),
) -> BasketRecommendationResponse:
    """Generate curated AI portfolio basket via GET query params."""
    service = get_grow_service(request)
    try:
        return service.recommend_basket(
            capital=capital,
            horizon=horizon,
            risk_persona=risk_persona,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.post(
    "/baskets/recommend",
    response_model=BasketRecommendationResponse,
    summary="Alias for AI Portfolio Basket recommendation",
)
async def recommend_basket_alias(
    payload: BasketRecommendationRequest,
    request: Request,
) -> BasketRecommendationResponse:
    """Alias for /grow/recommend to support /baskets/recommend routing."""
    return await recommend_basket_post(payload=payload, request=request)
