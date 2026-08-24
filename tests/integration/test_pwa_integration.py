"""Integration tests for PWA endpoints, headers, manifests, and client DOM elements."""

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
async def test_manifest_endpoint_served_with_correct_mime(test_app):
    """Verify /manifest.json is served with application/manifest+json MIME type and valid data."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test root /manifest.json
        resp = await client.get("/manifest.json")
        assert resp.status_code == 200
        content_type = resp.headers.get("content-type", "")
        assert "application/manifest+json" in content_type or "application/json" in content_type

        data = resp.json()
        assert data.get("short_name") == "QuantNiti"
        assert data.get("display") == "standalone"
        assert data.get("theme_color") == "#09090b"
        assert data.get("background_color") == "#09090b"
        assert data.get("start_url") == "/"
        assert data.get("id") in ["quantniti", "/"]

        # Also test static path /static/manifest.json
        static_resp = await client.get("/static/manifest.json")
        assert static_resp.status_code == 200


@pytest.mark.asyncio
async def test_service_worker_endpoint_served_with_allowed_header(test_app):
    """Verify /sw.js is served with application/javascript and Service-Worker-Allowed: / header."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test root /sw.js
        resp = await client.get("/sw.js")
        assert resp.status_code == 200
        content_type = resp.headers.get("content-type", "")
        assert "javascript" in content_type
        assert resp.headers.get("service-worker-allowed") == "/"

        # Also test static path /static/sw.js
        static_resp = await client.get("/static/sw.js")
        assert static_resp.status_code == 200


@pytest.mark.asyncio
async def test_offline_page_endpoint(test_app):
    """Verify /offline.html is served successfully."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/offline.html")
        assert resp.status_code == 200
        assert "text/html" in resp.headers.get("content-type", "")
        assert "QuantNiti" in resp.text


@pytest.mark.asyncio
async def test_pwa_icons_served(test_app):
    """Verify icon PNG and SVG assets are accessible via HTTP."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for icon_name in ["icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png", "icon.svg"]:
            resp = await client.get(f"/static/icons/{icon_name}")
            assert resp.status_code == 200, f"Icon {icon_name} should return 200"
            assert len(resp.content) > 0


@pytest.mark.asyncio
async def test_index_html_contains_pwa_metadata_and_elements(test_app):
    """Verify index.html includes manifest link, Apple meta tags, install button, and iOS banner."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/")
        assert resp.status_code == 200
        html = resp.text

        # 1. Manifest link & theme-color
        assert 'rel="manifest"' in html
        assert 'name="theme-color"' in html
        assert '#09090b' in html

        # 2. Apple PWA meta tags
        assert 'name="apple-mobile-web-app-capable"' in html
        assert 'name="apple-mobile-web-app-status-bar-style"' in html
        assert 'name="apple-mobile-web-app-title"' in html
        assert 'rel="apple-touch-icon"' in html

        # 3. Desktop Install Button
        assert 'id="pwaInstallBtn"' in html or 'pwa-install' in html.lower()

        # 4. iOS Install Guide Banner
        assert 'id="iosInstallBanner"' in html or 'ios-install' in html.lower()

        # 5. Service worker registration & desktop sidebar structure
        assert 'bottomNavBar' in html
