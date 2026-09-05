"""Integration tests for Sharable Portfolio Report Card (PDF/Image Export) (Ticket #15)."""

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
async def test_html_contains_report_card_cdn_scripts(test_app):
    """Verify index.html contains CDN script tags for html2canvas and jspdf."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/")
        assert resp.status_code == 200
        html = resp.text

        # Both CDN libraries required by Ticket #15
        assert "html2canvas" in html
        assert "jspdf" in html


@pytest.mark.asyncio
async def test_html_contains_download_and_share_buttons(test_app):
    """Verify index.html contains Download Report and Share buttons on Portfolio and Grow tabs."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/")
        assert resp.status_code == 200
        html = resp.text

        # Portfolio tab trigger buttons
        assert 'id="portfolioDownloadReportBtn"' in html or 'id="downloadReportBtn"' in html
        assert 'id="portfolioShareReportBtn"' in html or 'id="shareReportBtn"' in html

        # Grow tab basket report buttons
        assert 'id="basketDownloadReportBtn"' in html
        assert 'id="basketShareReportBtn"' in html


@pytest.mark.asyncio
async def test_html_contains_portfolio_report_card_template_with_all_sections(test_app):
    """Verify index.html contains hidden fixed-width report card template with all 8 mandatory sections."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/")
        assert resp.status_code == 200
        html = resp.text

        # Hidden template container
        assert 'id="portfolioReportCardTemplate"' in html

        # Section 1: Branded header with QuantNiti logo and generation timestamp
        assert 'id="reportTimestamp"' in html
        assert 'id="reportPortfolioName"' in html

        # Section 2: Portfolio allocation donut chart & holdings breakdown
        assert 'id="reportAllocationChart"' in html
        assert 'id="reportHoldingsList"' in html

        # Section 3: Probabilistic growth projection chart & scenario tiers
        assert 'id="reportGrowthChart"' in html
        assert 'id="reportGrowthTiers"' in html

        # Section 4: Trust Card 4-pillar summary grid
        assert 'id="reportTrustPillarsContainer"' in html

        # Section 5: Portfolio-level ESG Conscience Score
        assert 'id="reportEsgCard"' in html
        assert 'id="reportEsgScore"' in html
        assert 'id="reportEsgBadge"' in html

        # Section 6: Current market regime badge
        assert 'id="reportRegimeBadge"' in html

        # Section 7: Key metrics table
        assert 'id="reportTotalValue"' in html
        assert 'id="reportTotalReturn"' in html
        assert 'id="reportBenchmarkAlpha"' in html
        assert 'id="reportInvestedCapital"' in html

        # Section 8: Branded watermark footer with statutory SEBI disclaimer text
        assert 'id="reportDisclaimer"' in html or 'id="reportWatermark"' in html
        assert "SEBI" in html


@pytest.mark.asyncio
async def test_styles_contain_report_card_layout_rules(test_app):
    """Verify styles.css includes fixed-width layout (794px), watermark, and report card rules."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/static/styles.css")
        assert resp.status_code == 200
        css = resp.text

        # Fixed width for standard A4 portrait at 96 DPI
        assert "portfolioReportCardTemplate" in css or "report-card-template" in css
        assert "794px" in css or "800px" in css
        assert "report-watermark" in css or "report-disclaimer" in css


@pytest.mark.asyncio
async def test_app_js_contains_report_export_and_share_functions(test_app):
    """Verify app.js contains report card population, PDF/image blob generation, download, and Web Share API handlers."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/static/app.js")
        assert resp.status_code == 200
        js = resp.text

        # Public interface functions
        assert "populateReportCard" in js
        assert "generatePortfolioReportBlob" in js
        assert "downloadPortfolioReportPDF" in js
        assert "sharePortfolioReport" in js
        assert "navigator.share" in js
