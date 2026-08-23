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
