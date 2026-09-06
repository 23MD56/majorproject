"""Integration tests for Client Serving endpoints and static assets."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService


@pytest.fixture
def test_app(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    service = MarketDataService(provider=provider, cache=cache)
    return create_app(service=service)


@pytest.mark.asyncio
async def test_root_serves_html(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
        content = response.text
        assert "QuantNiti" in content
        assert "Grow" in content
        assert "Explore" in content
        assert "Quant Lab" in content
        assert "Portfolio" in content


@pytest.mark.asyncio
async def test_app_route_serves_html(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/app")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
        assert "QuantNiti" in response.text


@pytest.mark.asyncio
async def test_static_assets_served(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check static CSS
        css_resp = await client.get("/static/styles.css")
        assert css_resp.status_code == 200
        assert len(css_resp.text) > 0

        # Check static JS
        js_resp = await client.get("/static/app.js")
        assert js_resp.status_code == 200
        assert len(js_resp.text) > 0


@pytest.mark.asyncio
async def test_vite_build_assets_served(test_app):
    """Verify that Vite build artifacts in /static/dist and /vite endpoint are served."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        vite_resp = await client.get("/vite")
        assert vite_resp.status_code == 200
        assert "text/html" in vite_resp.headers.get("content-type", "")
        assert "QuantNiti" in vite_resp.text
        assert 'id="root"' in vite_resp.text
        assert "/static/dist/assets/" in vite_resp.text

        dist_html_resp = await client.get("/static/dist/index.html")
        assert dist_html_resp.status_code == 200
        assert 'id="root"' in dist_html_resp.text


@pytest.mark.asyncio
async def test_competitor_benchmark_drawer_served(test_app):
    """Verify that the in-app competitor benchmark drawer, triggers, and 10 dimensions are rendered."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        html = response.text

        # 1. Trigger Buttons
        assert "openCompareHeaderBtn" in html
        assert "openCompareTrustBtn" in html
        assert "Compare Platforms" in html or "Compare vs Existing Platforms" in html

        # 2. Drawer Modal Container & Controls
        assert "competitorBenchmarkModal" in html
        assert "closeCompetitorBenchmarkModal" in html

        # 3. Competitor Platforms Listed
        assert "MoneyControl" in html
        assert "Zerodha" in html
        assert "Groww" in html
        assert "INDmoney" in html
        assert "Smallcase" in html

        # 4. Verified 10 Comparison Dimensions
        assert "Forward Growth Forecasting" in html
        assert "Market Regime Classification" in html
        assert "Portfolio-Level Optimization" in html
        assert "Discrete Integer Share Sizing" in html
        assert "Explainable AI Trust Card" in html
        assert "Strategy Backtesting" in html or "Technical Strategy Backtesting" in html
        assert "Dynamic Regime Rebalance" in html or "Regime Rebalance Alerts" in html
        assert "Virtual Paper Portfolio" in html
        assert "Cost & Middleman Fees" in html or "0% Commission" in html
        assert "Audience Accessibility" in html or "Dual Experience" in html

        # 5. Academic Defense Grounding & Key Takeaways
        assert "Why Not Groww" in html or "Why Not Groww or INDmoney" in html
        assert "Why Not Zerodha" in html or "Why Not Zerodha Streak" in html
        assert "Why Not Smallcase" in html
