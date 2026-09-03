"""Integration tests for Multi-Portfolio Storage & Day-over-Day MTM REST API (Ticket #19)."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.data.service import MarketDataService
from app.data.storage import PortfolioRepository
from app.ml.forecasting.service import ExploreService
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService
from app.ml.simulation.service import PortfolioService


@pytest.fixture
def app_instance():
    """Create FastAPI application with PortfolioService and in-memory PortfolioRepository attached."""
    market_svc = MarketDataService()
    regime_svc = RegimeService(market_service=market_svc)
    explore_svc = ExploreService(market_service=market_svc, regime_service=regime_svc)
    grow_svc = GrowService(
        market_service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
    )
    repo = PortfolioRepository(database_url="sqlite:///:memory:")
    portfolio_svc = PortfolioService(
        market_service=market_svc,
        regime_service=regime_svc,
        grow_service=grow_svc,
        repository=repo,
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
async def test_create_and_list_multiple_portfolios(app_instance):
    """Verify creating distinct named goal portfolios and listing them."""
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create first goal portfolio: "Retirement SIP"
        payload_1 = {
            "name": "Retirement SIP",
            "capital": 100000.0,
            "risk_persona": "Balanced",
            "horizon": "12M",
        }
        res_1 = await client.post("/api/v1/portfolios", json=payload_1)
        assert res_1.status_code == 200
        p1 = res_1.json()
        assert p1["name"] == "Retirement SIP"
        assert p1["initial_capital"] == 100000.0
        assert "portfolio_id" in p1
        id_1 = p1["portfolio_id"]

        # 2. Create second goal portfolio: "Emergency Buffer"
        payload_2 = {
            "name": "Emergency Buffer",
            "capital": 50000.0,
            "risk_persona": "Conservative",
            "horizon": "3M",
        }
        res_2 = await client.post("/api/v1/portfolios", json=payload_2)
        assert res_2.status_code == 200
        p2 = res_2.json()
        assert p2["name"] == "Emergency Buffer"
        assert p2["initial_capital"] == 50000.0
        id_2 = p2["portfolio_id"]
        assert id_1 != id_2

        # 3. List all user portfolios
        res_list = await client.get("/api/v1/portfolios")
        assert res_list.status_code == 200
        ports = res_list.json()
        assert isinstance(ports, list)
        port_ids = [p["portfolio_id"] for p in ports]
        assert id_1 in port_ids
        assert id_2 in port_ids


@pytest.mark.asyncio
async def test_portfolio_detail_mtm_metrics(app_instance):
    """Verify GET /api/v1/portfolios/{id} calculates day-over-day MTM and separates 1D return from total P&L."""
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a test portfolio
        payload = {
            "name": "Defense Alpha",
            "capital": 75000.0,
            "risk_persona": "Aggressive",
            "horizon": "6M",
        }
        create_res = await client.post("/api/v1/portfolios", json=payload)
        assert create_res.status_code == 200
        pid = create_res.json()["portfolio_id"]

        # Fetch detail with MTM
        get_res = await client.get(f"/api/v1/portfolios/{pid}")
        assert get_res.status_code == 200
        data = get_res.json()

        assert data["portfolio_id"] == pid
        assert "pnl_1d" in data
        assert "pnl_1d_pct" in data
        assert "total_pnl" in data
        assert "total_pnl_pct" in data
        assert "current_value" in data

        # Check holdings have MTM fields
        assert len(data["holdings"]) > 0
        for h in data["holdings"]:
            assert "pnl_1d" in h
            assert "pnl_1d_pct" in h
            assert "prev_close_price" in h


@pytest.mark.asyncio
async def test_delete_portfolio_lifecycle(app_instance):
    """Verify DELETE /api/v1/portfolios/{id} removes the portfolio."""
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_res = await client.post("/api/v1/portfolios", json={"name": "Temp Goal", "capital": 25000.0})
        assert create_res.status_code == 200
        pid = create_res.json()["portfolio_id"]

        # Delete it
        del_res = await client.delete(f"/api/v1/portfolios/{pid}")
        assert del_res.status_code == 200
        assert del_res.json()["deleted"] is True

        # Ensure subsequent GET returns 404
        get_res = await client.get(f"/api/v1/portfolios/{pid}")
        assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_dual_prefix_routing_portfolios(app_instance):
    """Verify endpoints resolve on both /api/v1 and /api prefixes."""
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_v1 = await client.get("/api/v1/portfolios")
        res_legacy = await client.get("/api/portfolios")
        assert res_v1.status_code == 200
        assert res_legacy.status_code == 200
