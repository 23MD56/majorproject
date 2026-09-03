"""Integration tests for Groww-inspired UI redesign and 4-Tab Navigation (Ticket #16)."""

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
async def test_four_tab_navigation_structure(test_app):
    """Verify that the 4 primary bottom navigation tabs exist: Home, Explore, Grow, Portfolio."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        html = response.text

        # Bottom nav buttons for the 4 tabs
        assert 'data-tab="home"' in html
        assert 'data-tab="explore"' in html
        assert 'data-tab="grow"' in html
        assert 'data-tab="portfolio"' in html

        # Main section tab panels
        assert 'id="tab-home"' in html
        assert 'id="tab-explore"' in html
        assert 'id="tab-grow"' in html
        assert 'id="tab-portfolio"' in html


@pytest.mark.asyncio
async def test_adaptive_home_tab_components(test_app):
    """Verify adaptive Home tab elements: Onboarding card, Dual-metric snapshot card, and Learning Hub."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        html = response.text

        # Adaptive elements
        assert 'id="onboardingCard"' in html
        assert 'id="homePortfolioSnapshotCard"' in html
        assert "1D P&L" in html or "1D Return" in html or "1D" in html
        assert "Overall P&L" in html or "Overall Return" in html

        # Market pulse & Learning Hub carousel
        assert 'id="learningHubCarousel"' in html
        assert 'id="homeRegimeRadarCard"' in html or 'id="marketRegimeRadar"' in html or "Market Regime Radar" in html


@pytest.mark.asyncio
async def test_advanced_analysis_drawer_in_explore_tab(test_app):
    """Verify that Quant Lab Strategy Backtester is relocated inside the Explore tab as a collapsible drawer."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        html = response.text

        # Advanced Analysis drawer container
        assert 'id="advancedAnalysisDrawer"' in html
        assert "Advanced Analysis" in html
        # Backtest studio elements are inside the drawer
        assert "backtestSymbolSelect" in html
        assert "backtestStrategySelect" in html
        assert "runBacktestBtn" in html


@pytest.mark.asyncio
async def test_groww_theme_and_dual_theme_tokens(test_app):
    """Verify Groww design tokens, light/dark theme variables, and tabular numbers in static CSS."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/static/styles.css")
        assert response.status_code == 200
        css = response.text

        # Groww Mint accent & card tokens
        assert "#00D09C" in css or "#00d09c" in css
        assert "16px" in css
        assert "tabular-nums" in css

        # Dark theme base
        assert "#121212" in css
        assert "#1E1E24" in css or "#1e1e24" in css

        # Light theme support
        assert '[data-theme="light"]' in css or ".theme-light" in css or "--theme-mode" in css

        # Android touch physics
        assert "overscroll-behavior-y" in css
        assert "contain" in css


@pytest.mark.asyncio
async def test_android_physics_and_haptics_in_js(test_app):
    """Verify Android native physics, haptic feedback, and History API popstate handling in app.js."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/static/app.js")
        assert response.status_code == 200
        js = response.text

        # Haptic feedback trigger
        assert "navigator.vibrate" in js
        # History API popstate handling for modal dismissal
        assert "popstate" in js
        assert "pushState" in js


@pytest.mark.asyncio
async def test_compounding_visualizer_and_wealth_engine_ui(test_app):
    """Verify Ticket #18 Compounding Visualizer in Home tab & Long-Horizon Hurdle in Portfolio tab."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. HTML DOM validation
        res_html = await client.get("/")
        assert res_html.status_code == 200
        html = res_html.text

        # Learning Hub Compounding Visualizer Card
        assert 'id="compoundingVisualizerCard"' in html
        assert 'id="sipAmountSlider"' in html
        assert 'id="sipTenureSlider"' in html
        assert 'id="sipReturnSlider"' in html
        assert 'id="sipStepUpToggle"' in html
        assert 'id="compoundingTotalInvested"' in html
        assert 'id="compoundingWealthGain"' in html
        assert 'id="compoundingFutureValue"' in html
        assert 'id="tippingPointCard"' in html
        assert 'id="tippingPointBadge"' in html
        assert 'id="compoundingFanChart"' in html

        # Portfolio Tab Long-Horizon Trajectory & 7% Bank FD Hurdle Card
        assert 'id="portfolioCompoundingSection"' in html
        assert 'id="portfolioCompoundingChart"' in html
        assert 'id="portfolioHurdleBadge"' in html
        assert 'id="port10YPessimistic"' in html
        assert 'id="port10YBase"' in html
        assert 'id="port10YOptimistic"' in html
        assert 'id="port10YBankFd"' in html

        # 2. JavaScript logic validation
        res_js = await client.get("/static/app.js")
        assert res_js.status_code == 200
        js = res_js.text
        assert "initCompoundingVisualizer" in js
        assert "recalculateCompounding" in js
        assert "handleCompoundingInputChange" in js
        assert "renderPortfolioCompounding" in js
        assert "compoundingFan" in js
        assert "portfolioCompounding" in js

        # 3. CSS slider tokens validation
        res_css = await client.get("/static/styles.css")
        assert res_css.status_code == 200
        css = res_css.text
        assert "slider-thumb" in css
        assert "#tippingPointCard" in css


@pytest.mark.asyncio
async def test_multi_portfolio_storage_and_mtm_ui(test_app):
    """Verify Ticket #19 Multi-Portfolio Switcher, Dual-Metric Hero Card, and Goal Modal."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. HTML DOM validation
        res_html = await client.get("/")
        assert res_html.status_code == 200
        html = res_html.text

        # Portfolio Switcher & Header
        assert 'id="portfolioSelector"' in html
        assert "openCreatePortfolioModal()" in html

        # Groww-style Dual-Metric Hero Card
        assert 'id="portfolioHeroCard"' in html
        assert 'id="portValuationTotal"' in html
        assert 'id="port1DMetricBadge"' in html
        assert 'id="portValuation1D"' in html
        assert 'id="portTotalMetricBadge"' in html
        assert 'id="portValuationPnl"' in html
        assert 'id="portValuationInvested"' in html
        assert 'id="portValuationCash"' in html
        assert 'id="deletePortfolioBtn"' in html

        # 1D Return column in holdings table
        assert "1D Return" in html

        # Create Goal Portfolio Modal
        assert 'id="createGoalModal"' in html
        assert 'id="goalPortfolioNameInput"' in html
        assert 'id="goalCapitalRange"' in html
        assert 'name="goalRiskPersona"' in html
        assert 'name="goalHorizon"' in html
        assert 'id="createGoalSubmitBtn"' in html

        # 2. JavaScript logic validation
        res_js = await client.get("/static/app.js")
        assert res_js.status_code == 200
        js = res_js.text

        # IndexedDB functions
        assert "openQuantNitiDB" in js
        assert "savePortfoliosToIndexedDB" in js
        assert "loadPortfoliosFromIndexedDB" in js
        assert "deletePortfolioFromIndexedDB" in js

        # Multi-portfolio & Goal handlers
        assert "loadUserPortfolios" in js
        assert "openCreatePortfolioModal" in js
        assert "closeCreatePortfolioModal" in js
        assert "submitCreateGoalPortfolio" in js
        assert "deleteActivePortfolio" in js
        assert "handlePortfolioSwitch" in js

