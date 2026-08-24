"""FastAPI Application Factory for QuantNiti."""

import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes.backtest import router as backtest_router
from app.api.routes.explore import router as explore_router
from app.api.routes.grow import router as grow_router
from app.api.routes.health import router as health_router
from app.api.routes.market import router as market_router
from app.api.routes.portfolio import router as portfolio_router
from app.api.routes.regime import router as regime_router
from app.core.config import settings
from app.data.service import MarketDataService
from app.ml.backtest.service import BacktestService
from app.ml.forecasting.service import ExploreService
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService
from app.ml.simulation.service import PortfolioService


def create_app(
    service: Optional[MarketDataService] = None,
    regime_service: Optional[RegimeService] = None,
    explore_service: Optional[ExploreService] = None,
    grow_service: Optional[GrowService] = None,
    backtest_service: Optional[BacktestService] = None,
    portfolio_service: Optional[PortfolioService] = None,
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
    regime_svc = regime_service or RegimeService(market_service=market_svc)
    explore_svc = explore_service or ExploreService(market_service=market_svc, regime_service=regime_svc)
    grow_svc = grow_service or GrowService(
        market_service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
    )
    backtest_svc = backtest_service or BacktestService(
        market_service=market_svc,
        regime_service=regime_svc,
    )
    portfolio_svc = portfolio_service or PortfolioService(
        market_service=market_svc,
        regime_service=regime_svc,
        grow_service=grow_svc,
    )

    app.state.market_service = market_svc
    app.state.regime_service = regime_svc
    app.state.explore_service = explore_svc
    app.state.grow_service = grow_svc
    app.state.backtest_service = backtest_svc
    app.state.portfolio_service = portfolio_svc

    # Static assets directory
    static_dir = Path(__file__).resolve().parent.parent / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

        @app.get("/", response_class=FileResponse, include_in_schema=False)
        async def serve_root():
            return FileResponse(static_dir / "index.html")

        @app.get("/app", response_class=FileResponse, include_in_schema=False)
        async def serve_app_shell():
            return FileResponse(static_dir / "index.html")

        @app.get("/client", response_class=FileResponse, include_in_schema=False)
        async def serve_client_alias():
            return FileResponse(static_dir / "index.html")

        @app.get("/manifest.json", response_class=FileResponse, include_in_schema=False)
        async def serve_manifest():
            return FileResponse(
                static_dir / "manifest.json",
                media_type="application/manifest+json",
            )

        @app.get("/sw.js", response_class=FileResponse, include_in_schema=False)
        async def serve_service_worker():
            return FileResponse(
                static_dir / "sw.js",
                media_type="application/javascript",
                headers={"Service-Worker-Allowed": "/"},
            )

        @app.get("/offline.html", response_class=FileResponse, include_in_schema=False)
        async def serve_offline():
            return FileResponse(static_dir / "offline.html", media_type="text/html")



    # Register routers under prefix
    app.include_router(health_router, prefix=settings.api_v1_prefix)
    app.include_router(market_router, prefix=settings.api_v1_prefix)
    app.include_router(regime_router, prefix=settings.api_v1_prefix)
    app.include_router(explore_router, prefix=settings.api_v1_prefix)
    app.include_router(grow_router, prefix=settings.api_v1_prefix)
    app.include_router(backtest_router, prefix=settings.api_v1_prefix)
    app.include_router(portfolio_router, prefix=settings.api_v1_prefix)

    return app


# Default app instance for uvicorn
app = create_app()

