"""Integration tests for Compounding Visualizer API endpoint (Ticket #18)."""

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
async def test_compounding_endpoint_standalone_post(app_instance):
    """POST /api/v1/portfolio/compounding returns exact compounding calculations and GBM cones."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        payload = {
            "initial_lump_sum": 100000.0,
            "monthly_sip": 5000.0,
            "tenure_years": 10,
            "expected_return_pct": 12.0,
            "step_up_pct": 10.0,
            "annual_volatility_pct": 15.0,
        }
        res = await client.post("/api/v1/portfolio/compounding", json=payload)
        assert res.status_code == 200
        data = res.json()

        # 1. Summaries for Lump Sum, monthly SIP, and annual Step-Up SIP
        assert "lump_sum_summary" in data
        assert "regular_sip_summary" in data
        assert "step_up_sip_summary" in data

        lump = data["lump_sum_summary"]
        assert lump["total_invested"] == 100000.0
        assert lump["future_value"] > 300000.0
        assert lump["wealth_gain"] == round(lump["future_value"] - lump["total_invested"], 2)

        sip = data["regular_sip_summary"]
        assert sip["total_invested"] == 600000.0
        assert abs(sip["future_value"] - 1161695.38) <= 1.0

        step_up = data["step_up_sip_summary"]
        assert step_up["total_invested"] > sip["total_invested"]
        assert step_up["future_value"] > sip["future_value"]

        # 2. Geometric Brownian Motion (GBM) quantile cones
        assert "yearly_trajectories" in data
        yearly = data["yearly_trajectories"]
        assert len(yearly) == 10
        for pt in yearly:
            assert pt["gbm_pessimistic_10th"] <= pt["gbm_base_50th"] <= pt["gbm_optimistic_90th"]
            assert pt["bank_fd_value"] > 0

        # 3. Compounding Tipping Point
        assert "tipping_point" in data
        assert "is_reached" in data["tipping_point"]

        # 4. Bank FD Hurdle and Alpha
        assert data["bank_fd_hurdle_value"] > 0.0
        assert data["alpha_vs_bank_fd"] > 0.0


@pytest.mark.asyncio
async def test_compounding_endpoint_mounted_at_both_prefixes(app_instance):
    """Ensure both /api/v1/portfolio/compounding and /api/portfolio/compounding respond identically."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        payload = {
            "monthly_sip": 5000.0,
            "tenure_years": 5,
            "expected_return_pct": 12.0,
        }
        res_v1 = await client.post("/api/v1/portfolio/compounding", json=payload)
        res_api = await client.post("/api/portfolio/compounding", json=payload)

        assert res_v1.status_code == 200
        assert res_api.status_code == 200
        assert res_v1.json()["regular_sip_summary"]["future_value"] == res_api.json()["regular_sip_summary"]["future_value"]


@pytest.mark.asyncio
async def test_compounding_endpoint_with_portfolio_id(app_instance):
    """POST /api/v1/portfolio/compounding with active portfolio_id links active capital and returns."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        # 1. Create a portfolio first
        create_res = await client.post(
            "/api/portfolio/create",
            json={
                "name": "Compounding Growth Portfolio",
                "capital": 100000.0,
                "horizon": "6M",
                "risk_persona": "Balanced",
            },
        )
        assert create_res.status_code == 200
        port_data = create_res.json()
        pid = port_data["portfolio_id"]

        # 2. Call compounding endpoint with portfolio_id
        comp_res = await client.post(
            "/api/v1/portfolio/compounding",
            json={
                "portfolio_id": pid,
                "tenure_years": 10,
            },
        )
        assert comp_res.status_code == 200
        data = comp_res.json()
        # Initial lump sum seeded from portfolio current_value
        assert data["initial_lump_sum"] >= 50000.0
        assert len(data["yearly_trajectories"]) == 10


@pytest.mark.asyncio
async def test_compounding_endpoint_validation_errors(app_instance):
    """Invalid parameters return HTTP 422."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        # Negative monthly SIP
        res_neg = await client.post(
            "/api/v1/portfolio/compounding",
            json={"monthly_sip": -100.0},
        )
        assert res_neg.status_code == 422

        # Tenure exceeding 10 years
        res_tenure = await client.post(
            "/api/v1/portfolio/compounding",
            json={"tenure_years": 15},
        )
        assert res_tenure.status_code == 422
