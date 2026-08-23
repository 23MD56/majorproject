import numpy as np
import pandas as pd
import pytest
from app.ml.forecasting.factors import (
    compute_bollinger_bands,
    compute_ema,
    compute_macd,
    compute_max_drawdown,
    compute_rsi,
    compute_stock_beta_and_alpha,
    extract_stock_factors,
)


@pytest.fixture
def sample_stock_and_index():
    dates = pd.bdate_range("2023-01-01", periods=300)
    rng = np.random.default_rng(42)

    # Index: steady drift
    idx_returns = rng.normal(0.0004, 0.01, size=300)
    idx_prices = 20000.0 * np.exp(np.cumsum(idx_returns))
    index_df = pd.DataFrame(
        {
            "open": idx_prices * 0.998,
            "high": idx_prices * 1.006,
            "low": idx_prices * 0.993,
            "close": idx_prices,
            "adj_close": idx_prices,
            "volume": rng.integers(100000, 500000, size=300),
        },
        index=dates,
    )

    # Stock: higher beta (1.3x) + idiosyncratic noise
    stock_returns = 1.3 * idx_returns + rng.normal(0.0002, 0.008, size=300)
    stock_prices = 1500.0 * np.exp(np.cumsum(stock_returns))
    stock_df = pd.DataFrame(
        {
            "open": stock_prices * 0.997,
            "high": stock_prices * 1.009,
            "low": stock_prices * 0.991,
            "close": stock_prices,
            "adj_close": stock_prices,
            "volume": rng.integers(500000, 2000000, size=300),
        },
        index=dates,
    )

    return stock_df, index_df


def test_compute_rsi(sample_stock_and_index):
    stock_df, _ = sample_stock_and_index
    rsi = compute_rsi(stock_df["close"], period=14)
    assert len(rsi) == len(stock_df)
    valid_rsi = rsi.dropna()
    assert (valid_rsi >= 0.0).all() and (valid_rsi <= 100.0).all()


def test_compute_macd(sample_stock_and_index):
    stock_df, _ = sample_stock_and_index
    macd_line, signal_line, hist = compute_macd(stock_df["close"])
    assert len(macd_line) == len(stock_df)
    assert len(signal_line) == len(stock_df)
    assert len(hist) == len(stock_df)


def test_compute_bollinger_bands(sample_stock_and_index):
    stock_df, _ = sample_stock_and_index
    upper, mid, lower, pct_b = compute_bollinger_bands(stock_df["close"], period=20, std_dev=2.0)
    valid = (~upper.isna()) & (~lower.isna())
    assert (upper[valid] >= lower[valid]).all()
    assert (upper[valid] >= mid[valid]).all()
    assert (mid[valid] >= lower[valid]).all()


def test_compute_max_drawdown(sample_stock_and_index):
    stock_df, _ = sample_stock_and_index
    mdd = compute_max_drawdown(stock_df["close"])
    assert mdd <= 0.0  # Max drawdown is negative or 0
    assert mdd >= -1.0


def test_compute_stock_beta_and_alpha(sample_stock_and_index):
    stock_df, index_df = sample_stock_and_index
    stock_ret = stock_df["close"].pct_change().dropna()
    idx_ret = index_df["close"].pct_change().dropna()

    beta, alpha, corr = compute_stock_beta_and_alpha(stock_ret, idx_ret)
    # Since synthetic stock was generated with 1.3x beta
    assert pytest.approx(beta, rel=0.2) == 1.3
    assert -1.0 <= corr <= 1.0


def test_extract_all_stock_factors(sample_stock_and_index):
    stock_df, index_df = sample_stock_and_index
    factors = extract_stock_factors(stock_df, index_df)
    assert isinstance(factors, dict)
    assert "rsi_14" in factors
    assert "beta" in factors
    assert "alpha_annualized" in factors
    assert "max_drawdown_1y" in factors
    assert "realized_vol_30d" in factors
    assert "realized_vol_90d" in factors
    assert "momentum_1m" in factors
    assert "momentum_3m" in factors
    assert "momentum_6m" in factors
    assert "momentum_12m" in factors
    assert "ema_20_50_spread" in factors
    assert "ema_50_200_spread" in factors
    assert "bollinger_pct_b" in factors
