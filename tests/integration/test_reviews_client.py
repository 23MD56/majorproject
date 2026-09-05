"""Integration tests for Community Reviews frontend HTML, styling, and JS (Ticket #21)."""

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
async def test_html_contains_review_section_and_modal(test_app):
    """Verify index.html contains Community Reviews section and Write Review modal."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/")
        assert resp.status_code == 200
        html = resp.text

        # Review section in Grow tab
        assert 'id="basketReviewsSection"' in html or 'id="communityReviewsCard"' in html
        assert 'id="writeReviewBtn"' in html or 'id="openWriteReviewBtn"' in html
        assert 'id="reviewsListContainer"' in html or 'id="reviewsContainer"' in html

        # Write Review modal
        assert 'id="writeReviewModal"' in html
        assert 'id="reviewTextInput"' in html
        assert 'id="submitReviewBtn"' in html


@pytest.mark.asyncio
async def test_styles_contain_review_and_badge_classes(test_app):
    """Verify styles.css includes review cards, verified badge, and star rating styling."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/static/styles.css")
        assert resp.status_code == 200
        css = resp.text

        # Verified badge and review styling
        assert "badge-verified" in css or "review-verified-badge" in css
        assert "star-rating" in css or "review-star" in css


@pytest.mark.asyncio
async def test_app_js_contains_review_management_functions(test_app):
    """Verify app.js contains review loading, modal toggling, and review submission handlers."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/static/app.js")
        assert resp.status_code == 200
        js = resp.text

        # JS functions
        assert "loadBasketReviews" in js or "loadCommunityReviews" in js
        assert "submitUserReview" in js or "submitReview" in js
        assert "openWriteReviewModal" in js
