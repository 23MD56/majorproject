"""Integration tests for BacktestService in Quant Lab."""

import pytest

from app.core.models import (
    BacktestResponse,
    MarketRegimeType,
    StrategyType,
)
from app.data.service import MarketDataService
from app.ml.backtest.service import BacktestService
from app.ml.regime.service import RegimeService


@pytest.fixture
def backtest_service():
    """Create BacktestService with real market and regime services."""
    market_svc = MarketDataService()
    regime_svc = RegimeService(market_service=market_svc)
    return BacktestService(
        market_service=market_svc,
        regime_service=regime_svc,
    )


def test_backtest_service_run_buy_and_hold_nifty(backtest_service: BacktestService):
    """Run Buy & Hold strategy on NIFTY 50 benchmark."""
    resp = backtest_service.run_backtest(
        symbol="^NSEI",
        strategy=StrategyType.BUY_AND_HOLD,
        initial_capital=100000.0,
    )

    assert isinstance(resp, BacktestResponse)
    assert resp.symbol == "^NSEI"
    assert resp.strategy == StrategyType.BUY_AND_HOLD
    assert resp.initial_capital == 100000.0
    assert len(resp.equity_curve) > 50
    assert resp.metrics.final_equity > 0
    assert len(resp.regime_breakdown) == 3
    
    # Check that data points have equity and drawdown
    dp = resp.equity_curve[-1]
    assert dp.strategy_equity == resp.metrics.final_equity
    assert dp.drawdown_pct <= 0.0


def test_backtest_service_run_ma_crossover_stock(backtest_service: BacktestService):
    """Run Moving Average Crossover strategy on a specific NIFTY 50 stock."""
    resp = backtest_service.run_backtest(
        symbol="RELIANCE",
        strategy=StrategyType.MA_CROSSOVER,
        parameters={"fast_period": 20, "slow_period": 50},
        initial_capital=50000.0,
    )

    assert isinstance(resp, BacktestResponse)
    assert resp.symbol == "RELIANCE"
    assert resp.strategy == StrategyType.MA_CROSSOVER
    assert resp.initial_capital == 50000.0
    assert len(resp.equity_curve) > 50
    assert len(resp.regime_breakdown) == 3


def test_backtest_service_with_date_filter(backtest_service: BacktestService):
    """Test date range filtering on backtest."""
    resp = backtest_service.run_backtest(
        symbol="TCS",
        strategy=StrategyType.RSI_MEAN_REVERSION,
        start_date="2023-01-01",
        end_date="2024-01-01",
    )

    assert isinstance(resp, BacktestResponse)
    assert resp.start_date >= "2023-01-01"
    assert resp.end_date <= "2024-01-05"  # within trading calendar window


def test_backtest_service_invalid_symbol_raises_error(backtest_service: BacktestService):
    """Invalid stock symbol raises ValueError."""
    with pytest.raises(ValueError):
        backtest_service.run_backtest(symbol="INVALID_TICKER_XYZ")
