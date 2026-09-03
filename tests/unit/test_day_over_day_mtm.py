"""Unit tests for Day-over-Day Mark-to-Market (MTM) calculations (Ticket #19)."""

import pytest
from app.core.models import (
    MarketRegimeType,
    PortfolioHolding,
    PortfolioState,
    RiskPersona,
)
from app.ml.simulation.portfolio import (
    calculate_day_over_day_mtm,
    update_portfolio_mark_to_market,
)


@pytest.fixture
def base_portfolio():
    """Create a baseline portfolio with 2 holdings."""
    h1 = PortfolioHolding(
        symbol="RELIANCE",
        name="Reliance Industries Ltd.",
        sector="Energy",
        shares=10,
        buy_price=2000.0,
        current_price=2500.0,
        prev_close_price=2500.0,
        invested_amount=20000.0,
        current_value=25000.0,
        unrealized_pnl=5000.0,
        unrealized_pnl_pct=25.0,
        pnl_1d=0.0,
        pnl_1d_pct=0.0,
        weight=0.5,
    )
    h2 = PortfolioHolding(
        symbol="INFY",
        name="Infosys Ltd.",
        sector="Information Technology",
        shares=20,
        buy_price=1500.0,
        current_price=1600.0,
        prev_close_price=1600.0,
        invested_amount=30000.0,
        current_value=32000.0,
        unrealized_pnl=2000.0,
        unrealized_pnl_pct=6.67,
        pnl_1d=0.0,
        pnl_1d_pct=0.0,
        weight=0.5,
    )
    return PortfolioState(
        portfolio_id="port_mtm_test",
        name="Tech & Energy Goal",
        initial_capital=50000.0,
        cash=0.0,
        invested_capital=50000.0,
        current_value=57000.0,
        total_pnl=7000.0,
        total_pnl_pct=14.0,
        pnl_1d=0.0,
        pnl_1d_pct=0.0,
        holdings=[h1, h2],
        initial_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        current_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        risk_persona=RiskPersona.BALANCED,
        horizon="6M",
        created_at="2026-08-01",
        as_of_date="2026-09-02",
    )


def test_holding_day_over_day_mtm_formula(base_portfolio):
    """Holding 1D P&L must equal N_i * (P_{i, t} - P_{i, t-1}).
    
    RELIANCE: 10 shares, yesterday close = 2500.0, today price = 2550.0.
    1D P&L = 10 * (2550 - 2500) = +500.0
    1D P&L % = (2550 - 2500) / 2500 * 100 = +2.0%
    
    INFY: 20 shares, yesterday close = 1600.0, today price = 1580.0.
    1D P&L = 20 * (1580 - 1600) = -400.0
    1D P&L % = (1580 - 1600) / 1600 * 100 = -1.25%
    """
    latest_prices = {"RELIANCE": 2550.0, "INFY": 1580.0}
    prev_prices = {"RELIANCE": 2500.0, "INFY": 1600.0}

    updated = calculate_day_over_day_mtm(
        portfolio=base_portfolio,
        latest_prices=latest_prices,
        previous_close_prices=prev_prices,
    )

    h_rel = next(h for h in updated.holdings if h.symbol == "RELIANCE")
    assert h_rel.pnl_1d == 500.0
    assert h_rel.pnl_1d_pct == 2.0
    assert h_rel.prev_close_price == 2500.0
    assert h_rel.current_price == 2550.0

    h_infy = next(h for h in updated.holdings if h.symbol == "INFY")
    assert h_infy.pnl_1d == -400.0
    assert h_infy.pnl_1d_pct == -1.25
    assert h_infy.prev_close_price == 1600.0
    assert h_infy.current_price == 1580.0


def test_aggregate_portfolio_day_over_day_mtm(base_portfolio):
    """Aggregate 1D P&L is the sum of holding 1D P&Ls: Delta V_{1D} = sum Delta V_{i, 1D}.
    
    Today's P&L = +500 (RELIANCE) + (-400) (INFY) = +100.0.
    Start of day valuation = 25000 + 32000 = 57000.0.
    1D P&L % = +100.0 / 57000.0 * 100 = +0.18%.
    Total overall P&L = (25500 + 31600) - 50000 = +7100.0 (+14.2%).
    """
    latest_prices = {"RELIANCE": 2550.0, "INFY": 1580.0}
    prev_prices = {"RELIANCE": 2500.0, "INFY": 1600.0}

    updated = calculate_day_over_day_mtm(
        portfolio=base_portfolio,
        latest_prices=latest_prices,
        previous_close_prices=prev_prices,
    )

    assert updated.pnl_1d == 100.0
    assert round(updated.pnl_1d_pct, 2) == 0.18
    assert updated.current_value == 57100.0
    assert updated.total_pnl == 7100.0
    assert round(updated.total_pnl_pct, 2) == 14.2

    # Verify that Today's return is clearly separated from Total overall return
    assert updated.pnl_1d != updated.total_pnl
    assert updated.pnl_1d_pct != updated.total_pnl_pct
