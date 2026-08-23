"""Unit tests for Backtest Metrics & Regime Attribution."""

import numpy as np
import pandas as pd
import pytest

from app.core.models import (
    BacktestMetrics,
    BacktestTrade,
    MarketRegimeType,
    RegimePerformanceBreakdown,
)
from app.ml.backtest.engine import BacktestResultData
from app.ml.backtest.metrics import (
    calculate_backtest_metrics,
    calculate_regime_breakdown,
)


@pytest.fixture
def mock_backtest_result() -> BacktestResultData:
    """Create a mock backtest result with 252 days of data and 4 trades."""
    dates = [f"2025-01-{i:02d}" for i in range(1, 31)] + [f"2025-02-{i:02d}" for i in range(1, 29)]
    n = len(dates)
    
    np.random.seed(42)
    daily_rets = pd.Series(np.random.normal(0.0008, 0.01, n), index=dates)
    strat_rets = pd.Series(np.random.normal(0.0012, 0.009, n), index=dates)
    equity = 100000.0 * (1.0 + strat_rets).cumprod()
    running_max = equity.cummax()
    dd = (equity - running_max) / running_max
    
    trades = [
        BacktestTrade(
            entry_date="2025-01-05",
            exit_date="2025-01-15",
            entry_price=100.0,
            exit_price=110.0,
            shares=1000.0,
            return_pct=10.0,
            pnl=10000.0,
            bars_held=10,
            trade_type="LONG",
        ),
        BacktestTrade(
            entry_date="2025-01-20",
            exit_date="2025-01-25",
            entry_price=110.0,
            exit_price=105.0,
            shares=1000.0,
            return_pct=-4.55,
            pnl=-5000.0,
            bars_held=5,
            trade_type="LONG",
        ),
        BacktestTrade(
            entry_date="2025-02-01",
            exit_date="2025-02-10",
            entry_price=105.0,
            exit_price=115.0,
            shares=1000.0,
            return_pct=9.52,
            pnl=10000.0,
            bars_held=9,
            trade_type="LONG",
        ),
    ]
    
    bench_rets = pd.Series(np.random.normal(0.0005, 0.008, n), index=dates)
    bench_equity = 100000.0 * (1.0 + bench_rets).cumprod()

    return BacktestResultData(
        dates=dates,
        close_prices=pd.Series(100.0, index=dates),
        signals=pd.Series(1.0, index=dates),
        positions=pd.Series(1.0, index=dates),
        daily_returns=daily_rets,
        strategy_returns=strat_rets,
        equity_series=equity,
        drawdown_series=dd,
        benchmark_equity_series=bench_equity,
        benchmark_returns=bench_rets,
        trades=trades,
        initial_capital=100000.0,
        final_equity=float(equity.iloc[-1]),
        total_cost_paid=150.0,
    )


def test_calculate_backtest_metrics_values(mock_backtest_result: BacktestResultData):
    """Test performance metrics are computed correctly."""
    metrics = calculate_backtest_metrics(mock_backtest_result)
    
    assert isinstance(metrics, BacktestMetrics)
    assert metrics.initial_capital == 100000.0
    assert metrics.final_equity > 0
    assert metrics.total_trades == 3
    assert metrics.winning_trades == 2
    assert metrics.losing_trades == 1
    assert metrics.win_rate_pct == pytest.approx(66.67, rel=0.01)
    
    # Profit factor: gross gain (20000) / gross loss (5000) = 4.0
    assert metrics.profit_factor == pytest.approx(4.0, rel=0.01)
    assert metrics.max_drawdown_pct <= 0.0


def test_calculate_regime_breakdown(mock_backtest_result: BacktestResultData):
    """Test regime breakdown attribution."""
    dates = mock_backtest_result.dates
    n = len(dates)
    
    # Assign half Bull, one quarter Bear, one quarter Sideways
    regimes = (
        [MarketRegimeType.LOW_VOLATILITY_BULL.value] * (n // 2)
        + [MarketRegimeType.HIGH_VOLATILITY_BEAR.value] * (n // 4)
        + [MarketRegimeType.SIDEWAYS_CONSOLIDATION.value] * (n - (n // 2) - (n // 4))
    )
    regime_series = pd.Series(regimes, index=dates)

    breakdown = calculate_regime_breakdown(
        result=mock_backtest_result,
        regime_series=regime_series,
    )

    assert len(breakdown) == 3
    total_days = sum(b.days_count for b in breakdown)
    assert total_days == n
    
    reg_map = {b.regime: b for b in breakdown}
    assert MarketRegimeType.LOW_VOLATILITY_BULL in reg_map
    assert MarketRegimeType.HIGH_VOLATILITY_BEAR in reg_map
    assert MarketRegimeType.SIDEWAYS_CONSOLIDATION in reg_map
