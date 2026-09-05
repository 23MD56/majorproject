"""Integration tests for Smart Alerts frontend elements, CSS, Service Worker, and MarketStreamClient (Ticket #20)."""

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
async def test_html_contains_notification_bell_drawer_and_toasts(test_app):
    """Verify index.html contains notification bell button, drawer, and toast container."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/")
        assert resp.status_code == 200
        html = resp.text

        # Header bell icon and unread badge
        assert 'id="headerNotificationBtn"' in html or 'id="notificationBellBtn"' in html
        assert 'id="notificationBadge"' in html or 'id="notificationUnreadBadge"' in html

        # Notification drawer
        assert 'id="notificationCenterDrawer"' in html or 'id="notificationDrawer"' in html
        assert 'id="notificationList"' in html

        # Floating toast container
        assert 'id="toastContainer"' in html


@pytest.mark.asyncio
async def test_styles_contain_tick_flash_and_drawer(test_app):
    """Verify styles.css includes .tick-up, .tick-down flash animations and drawer styles."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/static/styles.css")
        assert resp.status_code == 200
        css = resp.text

        # Tick animations
        assert ".tick-up" in css
        assert ".tick-down" in css

        # Notification drawer classes
        assert "notification-drawer" in css or "toast-container" in css


@pytest.mark.asyncio
async def test_service_worker_push_event_listeners(test_app):
    """Verify sw.js contains push and notificationclick event listeners."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/sw.js")
        assert resp.status_code == 200
        sw = resp.text

        # Push API listeners
        assert 'addEventListener("push"' in sw or "addEventListener('push'" in sw
        assert 'addEventListener("notificationclick"' in sw or "addEventListener('notificationclick'" in sw


@pytest.mark.asyncio
async def test_app_js_contains_market_stream_client(test_app):
    """Verify app.js contains MarketStreamClient implementation with EventSource handling."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/static/app.js")
        assert resp.status_code == 200
        js = resp.text

        # MarketStreamClient
        assert "MarketStreamClient" in js
        assert "tick-up" in js
        assert "tick-down" in js
