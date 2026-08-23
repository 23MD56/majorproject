"""Integration tests for Backtest and Quant Lab API routes."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.core.config import settings
from app.data.service import MarketDataService
from app.ml.backtest.service import BacktestService
from app.ml.regime.service import RegimeService


@pytest.fixture
def app_instance():
    """Create FastAPI application with backtest service attached."""
    market_svc = MarketDataService()
    regime_svc = RegimeService(market_service=market_svc)
    backtest_svc = BacktestService(
        market_service=market_svc,
        regime_service=regime_svc,
    )
    app = create_app(
        service=market_svc,
        regime_service=regime_svc,
        backtest_service=backtest_svc,
    )
    return app


@pytest.mark.asyncio
async def test_post_backtest_run_success(app_instance):
    """POST /api/v1/backtest/run executes backtest simulation successfully."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        payload = {
            "symbol": "^NSEI",
            "strategy": "Buy & Hold",
            "initial_capital": 100000.0,
        }
        response = await client.post(f"{settings.api_v1_prefix}/backtest/run", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "^NSEI"
        assert data["strategy"] == "Buy & Hold"
        assert data["initial_capital"] == 100000.0
        assert "metrics" in data
        assert "equity_curve" in data
        assert "regime_breakdown" in data
        assert len(data["regime_breakdown"]) == 3


@pytest.mark.asyncio
async def test_get_backtest_run_success(app_instance):
    """GET /api/v1/backtest/run with query parameters returns 200."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        response = await client.get(
            f"{settings.api_v1_prefix}/backtest/run?symbol=RELIANCE&strategy=Moving Average Crossover&initial_capital=75000"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "RELIANCE"
        assert data["strategy"] == "Moving Average Crossover"


@pytest.mark.asyncio
async def test_post_quant_lab_backtest_alias(app_instance):
    """POST /api/v1/quant-lab/backtest alias route returns 200."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        payload = {
            "symbol": "INFY",
            "strategy": "RSI Mean Reversion",
            "initial_capital": 50000.0,
        }
        response = await client.post(f"{settings.api_v1_prefix}/quant-lab/backtest", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "INFY"


@pytest.mark.asyncio
async def test_backtest_validation_errors(app_instance):
    """Invalid capital, invalid strategy or unknown symbol returns error codes."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        # Invalid capital < 1000
        resp1 = await client.post(
            f"{settings.api_v1_prefix}/backtest/run",
            json={"symbol": "TCS", "strategy": "Buy & Hold", "initial_capital": 100.0},
        )
        assert resp1.status_code == 422

        # Invalid strategy
        resp2 = await client.post(
            f"{settings.api_v1_prefix}/backtest/run",
            json={"symbol": "TCS", "strategy": "Arbitrage", "initial_capital": 100000.0},
        )
        assert resp2.status_code == 422

        # Invalid symbol -> 400
        resp3 = await client.post(
            f"{settings.api_v1_prefix}/backtest/run",
            json={"symbol": "NONEXISTENT_TICKER", "strategy": "Buy & Hold", "initial_capital": 100000.0},
        )
        assert resp3.status_code == 400
