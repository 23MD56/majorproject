"""Unit tests for Portfolio Simulator and Mark-to-Market Engine."""

import pytest
from app.core.models import (
    MarketRegimeType,
    PortfolioHolding,
    PortfolioState,
    RiskPersona,
)
from app.ml.simulation.portfolio import (
    PortfolioSimulator,
    create_portfolio_from_allocations,
    update_portfolio_mark_to_market,
)


@pytest.fixture
def sample_allocations():
    return [
        {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy", "weight": 0.40, "price": 2500.0},
        {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT", "weight": 0.30, "price": 3500.0},
        {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Financial Services", "weight": 0.30, "price": 1600.0},
    ]


def test_create_portfolio_from_allocations(sample_allocations):
    """Initial portfolio creation correctly buys shares and tracks remaining cash."""
    capital = 100000.0
    portfolio = create_portfolio_from_allocations(
        name="My Balanced Growth",
        capital=capital,
        allocations=sample_allocations,
        risk_persona=RiskPersona.BALANCED,
        horizon="6M",
        active_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        as_of_date="2026-08-23",
    )

    assert isinstance(portfolio, PortfolioState)
    assert portfolio.initial_capital == capital
    assert portfolio.current_value == pytest.approx(capital, rel=1e-3)
    assert portfolio.total_pnl == 0.0
    assert portfolio.total_pnl_pct == 0.0
    assert len(portfolio.holdings) == 3
    
    # Invariant: cash + sum(holding values) == current_value
    holdings_val = sum(h.current_value for h in portfolio.holdings)
    assert pytest.approx(portfolio.cash + holdings_val, rel=1e-3) == portfolio.current_value


def test_update_portfolio_mark_to_market(sample_allocations):
    """Mark-to-market updates current prices, gains, and unrealized P&L."""
    capital = 100000.0
    portfolio = create_portfolio_from_allocations(
        name="Test Portfolio",
        capital=capital,
        allocations=sample_allocations,
        risk_persona=RiskPersona.BALANCED,
        horizon="6M",
        active_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        as_of_date="2026-08-23",
    )

    # Simulate price changes (+10% Reliance, -5% TCS, +5% HDFC Bank)
    updated_quotes = {
        "RELIANCE": 2750.0,  # +10%
        "TCS": 3325.0,       # -5%
        "HDFCBANK": 1680.0,  # +5%
    }
    
    updated_portfolio = update_portfolio_mark_to_market(
        portfolio=portfolio,
        latest_prices=updated_quotes,
        benchmark_index_price=25000.0,
        benchmark_initial_price=24000.0,
        elapsed_days=30,
        as_of_date="2026-09-22",
    )

    assert updated_portfolio.current_value > capital
    assert updated_portfolio.total_pnl > 0.0
    assert updated_portfolio.total_pnl_pct > 0.0
    
    # Check Reliance holding
    rel = next(h for h in updated_portfolio.holdings if h.symbol == "RELIANCE")
    assert rel.current_price == 2750.0
    assert rel.unrealized_pnl > 0
    assert rel.unrealized_pnl_pct == pytest.approx(10.0, rel=1e-2)

    # Check Benchmark comparison
    bench = updated_portfolio.benchmark_comparison
    assert bench is not None
    assert bench.portfolio_return_pct == updated_portfolio.total_pnl_pct
    assert bench.nifty_return_pct == pytest.approx((25000 / 24000 - 1) * 100.0, rel=1e-2)
    # 7% FD pro-rated for 30 days = 7.0 * (30/365) = ~0.58%
    assert bench.bank_fd_return_pct == pytest.approx(7.0 * (30 / 365.0), rel=1e-2)
