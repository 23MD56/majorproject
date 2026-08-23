"""Unit tests for Regime-Shift Rebalance Diff Engine and Broker Order Sheet."""

import pytest
from app.core.models import (
    BrokerOrderSheet,
    MarketRegimeType,
    PortfolioState,
    RebalanceAlert,
    RiskPersona,
)
from app.ml.simulation.portfolio import create_portfolio_from_allocations
from app.ml.simulation.rebalance import (
    compute_rebalance_diff,
    execute_rebalance,
    generate_broker_order_sheet,
)


@pytest.fixture
def bull_portfolio() -> PortfolioState:
    allocations = [
        {"symbol": "RELIANCE", "name": "Reliance", "sector": "Energy", "weight": 0.40, "price": 2500.0},
        {"symbol": "INFY", "name": "Infosys", "sector": "IT", "weight": 0.35, "price": 1500.0},
        {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Financial Services", "weight": 0.25, "price": 1600.0},
    ]
    return create_portfolio_from_allocations(
        name="Bull Alpha Portfolio",
        capital=100000.0,
        allocations=allocations,
        risk_persona=RiskPersona.BALANCED,
        horizon="6M",
        active_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        as_of_date="2026-08-23",
    )


def test_compute_rebalance_diff_on_regime_shift(bull_portfolio: PortfolioState):
    """When regime shifts to High-Volatility Bear, rebalance diff recommends defensive tilts."""
    # Target allocations in Bear regime: Trim INFY (high-beta tech), add ITC (defensive FMCG)
    bear_target_allocations = [
        {"symbol": "RELIANCE", "name": "Reliance", "sector": "Energy", "weight": 0.30, "price": 2500.0},
        {"symbol": "INFY", "name": "Infosys", "sector": "IT", "weight": 0.15, "price": 1500.0},
        {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Financial Services", "weight": 0.25, "price": 1600.0},
        {"symbol": "ITC", "name": "ITC Ltd", "sector": "FMCG", "weight": 0.30, "price": 450.0},
    ]

    alert = compute_rebalance_diff(
        portfolio=bull_portfolio,
        target_allocations=bear_target_allocations,
        current_regime=MarketRegimeType.HIGH_VOLATILITY_BEAR,
        latest_prices={"RELIANCE": 2500.0, "INFY": 1500.0, "HDFCBANK": 1600.0, "ITC": 450.0},
    )

    assert isinstance(alert, RebalanceAlert)
    assert alert.is_rebalance_recommended is True
    assert alert.previous_regime == MarketRegimeType.LOW_VOLATILITY_BULL
    assert alert.new_regime == MarketRegimeType.HIGH_VOLATILITY_BEAR
    assert "shifted" in alert.trigger_reason.lower()

    # Check diff items
    diff_map = {item.symbol: item for item in alert.items}
    assert "ITC" in diff_map
    assert diff_map["ITC"].action == "BUY"
    assert diff_map["ITC"].shares_diff > 0

    assert diff_map["INFY"].action == "SELL"
    assert diff_map["INFY"].shares_diff < 0


def test_execute_rebalance_updates_holdings(bull_portfolio: PortfolioState):
    """Applying rebalance successfully transitions holdings and updates regime."""
    bear_target_allocations = [
        {"symbol": "RELIANCE", "name": "Reliance", "sector": "Energy", "weight": 0.40, "price": 2500.0},
        {"symbol": "ITC", "name": "ITC Ltd", "sector": "FMCG", "weight": 0.60, "price": 450.0},
    ]

    alert = compute_rebalance_diff(
        portfolio=bull_portfolio,
        target_allocations=bear_target_allocations,
        current_regime=MarketRegimeType.HIGH_VOLATILITY_BEAR,
        latest_prices={"RELIANCE": 2500.0, "INFY": 1500.0, "HDFCBANK": 1600.0, "ITC": 450.0},
    )

    rebalanced_portfolio = execute_rebalance(bull_portfolio, alert)
    assert rebalanced_portfolio.current_regime == MarketRegimeType.HIGH_VOLATILITY_BEAR
    symbols = [h.symbol for h in rebalanced_portfolio.holdings]
    assert "ITC" in symbols
    assert "INFY" not in symbols


def test_generate_broker_order_sheet(bull_portfolio: PortfolioState):
    """Generate Zerodha CSV and Groww text format order sheets."""
    order_sheet = generate_broker_order_sheet(bull_portfolio)

    assert isinstance(order_sheet, BrokerOrderSheet)
    assert order_sheet.total_orders == len(bull_portfolio.holdings)
    assert order_sheet.total_estimated_amount > 0

    # Zerodha CSV format verification
    assert "Instrument,Exchange,Action,Order Type,Quantity,Price,Product Type" in order_sheet.zerodha_csv_text
    assert "RELIANCE,NSE,BUY,MARKET" in order_sheet.zerodha_csv_text

    # Groww text format verification
    assert "QuantNiti Order Sheet" in order_sheet.groww_clipboard_text
    assert "• BUY" in order_sheet.groww_clipboard_text
