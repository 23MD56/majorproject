"""Integration tests for PortfolioService (Virtual Paper Portfolio Simulator)."""

import pytest

from app.core.models import (
    BrokerOrderSheet,
    CreatePortfolioRequest,
    MarketRegimeType,
    PortfolioState,
    RebalanceAlert,
    RiskPersona,
)
from app.data.service import MarketDataService
from app.ml.forecasting.service import ExploreService
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService
from app.ml.simulation.service import PortfolioService


@pytest.fixture
def portfolio_service():
    """Create PortfolioService with all domain dependencies."""
    market_svc = MarketDataService()
    regime_svc = RegimeService(market_service=market_svc)
    explore_svc = ExploreService(market_service=market_svc, regime_service=regime_svc)
    grow_svc = GrowService(
        market_service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
    )
    return PortfolioService(
        market_service=market_svc,
        regime_service=regime_svc,
        grow_service=grow_svc,
    )


def test_create_and_get_portfolio(portfolio_service: PortfolioService):
    """Creating a portfolio automatically generates basket allocations and persists state."""
    req = CreatePortfolioRequest(
        name="Test Portfolio Alpha",
        capital=50000.0,
        horizon="6M",
        risk_persona=RiskPersona.BALANCED,
    )

    portfolio = portfolio_service.create_portfolio(req)
    assert isinstance(portfolio, PortfolioState)
    assert portfolio.initial_capital == 50000.0
    assert len(portfolio.holdings) >= 4

    # Retrieve portfolio
    fetched = portfolio_service.get_portfolio(portfolio.portfolio_id)
    assert fetched.portfolio_id == portfolio.portfolio_id
    assert fetched.current_value > 0
    assert fetched.benchmark_comparison is not None


def test_rebalance_diff_and_apply(portfolio_service: PortfolioService):
    """Evaluate rebalance alert and apply rebalance."""
    req = CreatePortfolioRequest(
        name="Dynamic Portfolio",
        capital=75000.0,
        horizon="6M",
        risk_persona=RiskPersona.BALANCED,
    )
    portfolio = portfolio_service.create_portfolio(req)

    # Get rebalance diff
    diff_alert = portfolio_service.get_rebalance_diff(portfolio.portfolio_id)
    assert isinstance(diff_alert, RebalanceAlert)
    assert diff_alert.portfolio_id == portfolio.portfolio_id

    # Apply rebalance
    updated = portfolio_service.apply_rebalance(portfolio.portfolio_id)
    assert updated.portfolio_id == portfolio.portfolio_id
    assert len(updated.holdings) >= 4


def test_get_order_sheet(portfolio_service: PortfolioService):
    """Export 1-click broker order sheet for Zerodha and Groww."""
    req = CreatePortfolioRequest(
        name="Order Sheet Test",
        capital=60000.0,
        horizon="3M",
        risk_persona=RiskPersona.CONSERVATIVE,
    )
    portfolio = portfolio_service.create_portfolio(req)

    sheet = portfolio_service.get_order_sheet(portfolio.portfolio_id)
    assert isinstance(sheet, BrokerOrderSheet)
    assert sheet.total_orders > 0
    assert "Zerodha" in sheet.zerodha_csv_text or "Instrument" in sheet.zerodha_csv_text
    assert "Groww" in sheet.groww_clipboard_text or "QuantNiti" in sheet.groww_clipboard_text


def test_get_nonexistent_portfolio_raises_error(portfolio_service: PortfolioService):
    """Nonexistent portfolio ID raises KeyError / ValueError."""
    with pytest.raises(KeyError):
        portfolio_service.get_portfolio("nonexistent_id_999")
