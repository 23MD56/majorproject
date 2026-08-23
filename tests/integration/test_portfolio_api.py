"""Integration tests for Portfolio API routes."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.core.config import settings
from app.data.service import MarketDataService
from app.ml.forecasting.service import ExploreService
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService
from app.ml.simulation.service import PortfolioService


@pytest.fixture
def app_instance():
    """Create FastAPI application with PortfolioService attached."""
    market_svc = MarketDataService()
    regime_svc = RegimeService(market_service=market_svc)
    explore_svc = ExploreService(market_service=market_svc, regime_service=regime_svc)
    grow_svc = GrowService(
        market_service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
    )
    portfolio_svc = PortfolioService(
        market_service=market_svc,
        regime_service=regime_svc,
        grow_service=grow_svc,
    )
    app = create_app(
        service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
        grow_service=grow_svc,
        portfolio_service=portfolio_svc,
    )
    return app


@pytest.mark.asyncio
async def test_portfolio_full_lifecycle_api(app_instance):
    """Test portfolio creation, retrieval, rebalance diff, rebalance application, and order sheet export."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        # 1. Create Portfolio
        create_payload = {
            "name": "Live Wealth Portfolio",
            "capital": 50000.0,
            "horizon": "6M",
            "risk_persona": "Balanced",
        }
        res_create = await client.post(f"{settings.api_v1_prefix}/portfolio/create", json=create_payload)
        assert res_create.status_code == 200
        p_data = res_create.json()
        pid = p_data["portfolio_id"]
        assert p_data["initial_capital"] == 50000.0
        assert len(p_data["holdings"]) >= 4

        # 2. Get Portfolio Status
        res_get = await client.get(f"{settings.api_v1_prefix}/portfolio/{pid}")
        assert res_get.status_code == 200
        assert res_get.json()["portfolio_id"] == pid

        # 3. Get Rebalance Diff
        res_diff = await client.get(f"{settings.api_v1_prefix}/portfolio/{pid}/rebalance")
        assert res_diff.status_code == 200
        diff_data = res_diff.json()
        assert diff_data["portfolio_id"] == pid
        assert "items" in diff_data

        # 4. Apply Rebalance
        res_apply = await client.post(f"{settings.api_v1_prefix}/portfolio/{pid}/rebalance/apply")
        assert res_apply.status_code == 200
        assert res_apply.json()["portfolio_id"] == pid

        # 5. Get Order Sheet
        res_order = await client.get(f"{settings.api_v1_prefix}/portfolio/{pid}/order-sheet")
        assert res_order.status_code == 200
        sheet = res_order.json()
        assert sheet["portfolio_id"] == pid
        assert sheet["total_orders"] > 0
        assert "zerodha_csv_text" in sheet
        assert "groww_clipboard_text" in sheet


@pytest.mark.asyncio
async def test_portfolio_not_found_errors(app_instance):
    """Requesting nonexistent portfolio ID returns 404."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        res = await client.get(f"{settings.api_v1_prefix}/portfolio/nonexistent_123")
        assert res.status_code == 404
