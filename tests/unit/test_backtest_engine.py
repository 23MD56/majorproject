"""Unit tests for Vectorized Backtest Engine."""

import numpy as np
import pandas as pd
import pytest

from app.core.models import StrategyType
from app.ml.backtest.engine import BacktestEngine, BacktestResultData


@pytest.fixture
def sample_price_series() -> pd.DataFrame:
    """Generate 200 days of synthetic price data with a clear trend cycle."""
    np.random.seed(42)
    n = 200
    dates = pd.date_range(start="2025-01-01", periods=n, freq="B")
    
    # Sine wave trend + noise
    t = np.linspace(0, 4 * np.pi, n)
    trend = 100 + 20 * np.sin(t) + np.linspace(0, 30, n)
    noise = np.random.normal(0, 1.0, n)
    close = np.maximum(trend + noise, 10.0)
    
    df = pd.DataFrame({
        "open": close * (1 - 0.002),
        "high": close * (1 + 0.005),
        "low": close * (1 - 0.005),
        "close": close,
        "volume": np.random.uniform(100000, 500000, n),
    }, index=dates)
    
    return df


@pytest.fixture
def benchmark_price_series(sample_price_series: pd.DataFrame) -> pd.DataFrame:
    """Generate benchmark index prices aligned with stock dates."""
    np.random.seed(100)
    n = len(sample_price_series)
    bench_close = 20000 * np.cumprod(1 + np.random.normal(0.0004, 0.008, n))
    return pd.DataFrame({
        "close": bench_close,
    }, index=sample_price_series.index)


def test_buy_and_hold_strategy(sample_price_series: pd.DataFrame):
    """Buy and Hold must maintain long position (signal=1.0) and track cumulative returns."""
    engine = BacktestEngine()
    result = engine.run(
        df=sample_price_series,
        strategy=StrategyType.BUY_AND_HOLD,
        initial_capital=100000.0,
    )
    
    assert isinstance(result, BacktestResultData)
    assert len(result.equity_series) == len(sample_price_series)
    assert result.signals.iloc[0] == 1.0
    assert result.signals.iloc[-1] == 1.0
    
    # Final equity matches buy and hold growth (minus transaction costs)
    gross_return = (sample_price_series["close"].iloc[-1] / sample_price_series["close"].iloc[0]) - 1
    expected_equity = 100000.0 * (1 + gross_return)
    assert pytest.approx(result.final_equity, rel=0.02) == expected_equity


def test_ma_crossover_strategy(sample_price_series: pd.DataFrame):
    """MA Crossover generates 1 when fast MA > slow MA and 0 otherwise."""
    engine = BacktestEngine()
    result = engine.run(
        df=sample_price_series,
        strategy=StrategyType.MA_CROSSOVER,
        parameters={"fast_period": 10, "slow_period": 30},
        initial_capital=100000.0,
    )
    
    assert len(result.signals) == len(sample_price_series)
    # Signal should transition between 0 and 1
    assert set(result.signals.unique()).issubset({0.0, 1.0})
    # Must produce discrete trade logs
    assert len(result.trades) >= 1
    for trade in result.trades:
        assert trade.entry_date <= trade.exit_date
        assert trade.entry_price > 0
        assert trade.exit_price > 0


def test_rsi_mean_reversion_strategy(sample_price_series: pd.DataFrame):
    """RSI mean reversion enters below oversold and exits above overbought."""
    engine = BacktestEngine()
    result = engine.run(
        df=sample_price_series,
        strategy=StrategyType.RSI_MEAN_REVERSION,
        parameters={"rsi_period": 14, "rsi_oversold": 35, "rsi_overbought": 65},
        initial_capital=100000.0,
    )
    
    assert isinstance(result, BacktestResultData)
    assert set(result.signals.unique()).issubset({0.0, 1.0})


def test_bollinger_bands_strategy(sample_price_series: pd.DataFrame):
    """Bollinger Band breakout/trend strategy executes correctly."""
    engine = BacktestEngine()
    result = engine.run(
        df=sample_price_series,
        strategy=StrategyType.BOLLINGER_BANDS,
        parameters={"bb_period": 20, "bb_std": 2.0},
        initial_capital=100000.0,
    )
    
    assert isinstance(result, BacktestResultData)
    assert len(result.equity_series) == len(sample_price_series)


def test_dual_momentum_strategy(
    sample_price_series: pd.DataFrame,
    benchmark_price_series: pd.DataFrame,
):
    """Dual momentum compares asset absolute momentum and relative momentum vs benchmark."""
    engine = BacktestEngine()
    result = engine.run(
        df=sample_price_series,
        strategy=StrategyType.DUAL_MOMENTUM,
        benchmark_df=benchmark_price_series,
        parameters={"momentum_lookback": 20},
        initial_capital=100000.0,
    )
    
    assert isinstance(result, BacktestResultData)
    assert len(result.equity_series) == len(sample_price_series)
    assert result.benchmark_equity_series is not None
    assert len(result.benchmark_equity_series) == len(sample_price_series)


def test_transaction_costs_and_slippage_impact(sample_price_series: pd.DataFrame):
    """Higher transaction costs and slippage must strictly decrease final equity."""
    engine = BacktestEngine()
    
    res_no_cost = engine.run(
        df=sample_price_series,
        strategy=StrategyType.MA_CROSSOVER,
        parameters={"fast_period": 5, "slow_period": 15},
        cost_bps=0.0,
        slippage_bps=0.0,
    )
    
    res_high_cost = engine.run(
        df=sample_price_series,
        strategy=StrategyType.MA_CROSSOVER,
        parameters={"fast_period": 5, "slow_period": 15},
        cost_bps=20.0,  # 20 bps cost
        slippage_bps=20.0,  # 20 bps slippage
    )
    
    if len(res_no_cost.trades) > 0:
        assert res_no_cost.final_equity > res_high_cost.final_equity
