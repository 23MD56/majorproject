"""FastAPI Application Factory for QuantNiti."""

from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.market import router as market_router
from app.api.routes.regime import router as regime_router
from app.core.config import settings
from app.data.service import MarketDataService
from app.ml.regime.service import RegimeService


def create_app(
    service: Optional[MarketDataService] = None,
    regime_service: Optional[RegimeService] = None,
) -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title="QuantNiti Core API",
        description="AI-Driven Regime-Adaptive Portfolio & Stock Growth Intelligence Platform",
        version="0.1.0",
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Attach Services to state
    market_svc = service or MarketDataService()
    app.state.market_service = market_svc
    app.state.regime_service = regime_service or RegimeService(market_service=market_svc)

    # Register routers under prefix
    app.include_router(health_router, prefix=settings.api_v1_prefix)
    app.include_router(market_router, prefix=settings.api_v1_prefix)
    app.include_router(regime_router, prefix=settings.api_v1_prefix)

    return app


# Default app instance for uvicorn
app = create_app()
