import numpy as np
import pandas as pd
import pytest
from app.ml.regime.features import (
    calculate_parkinson_volatility,
    calculate_realized_volatility,
    calculate_rolling_log_returns,
    extract_regime_features,
)


@pytest.fixture
def sample_market_data():
    dates = pd.bdate_range("2024-01-01", periods=100)
    # Synthetic index
    prices = 20000.0 * np.exp(np.cumsum(np.random.normal(0.0005, 0.01, size=100)))
    index_df = pd.DataFrame(
        {
            "open": prices * 0.998,
            "high": prices * 1.008,
            "low": prices * 0.992,
            "close": prices,
            "adj_close": prices,
            "volume": np.random.randint(100000, 500000, size=100),
        },
        index=dates,
    )
    # Synthetic VIX
    vix_prices = 14.0 + np.random.normal(0, 1.5, size=100)
    vix_prices = np.clip(vix_prices, 10.0, 30.0)
    vix_df = pd.DataFrame(
        {
            "open": vix_prices,
            "high": vix_prices * 1.02,
            "low": vix_prices * 0.98,
            "close": vix_prices,
            "adj_close": vix_prices,
            "volume": np.zeros(100),
        },
        index=dates,
    )
    return index_df, vix_df


def test_calculate_rolling_log_returns(sample_market_data):
    index_df, _ = sample_market_data
    ret_20 = calculate_rolling_log_returns(index_df["close"], window=20)
    assert len(ret_20) == len(index_df)
    assert ret_20.iloc[:19].isna().all()
    assert not ret_20.iloc[20:].isna().any()


def test_calculate_realized_volatility(sample_market_data):
    index_df, _ = sample_market_data
    vol_20 = calculate_realized_volatility(index_df["close"], window=20, annualize=True)
    assert len(vol_20) == len(index_df)
    assert vol_20.iloc[20:].mean() > 0.0


def test_calculate_parkinson_volatility(sample_market_data):
    index_df, _ = sample_market_data
    pvol = calculate_parkinson_volatility(index_df["high"], index_df["low"], window=20)
    assert len(pvol) == len(index_df)
    assert (pvol.dropna() > 0).all()


def test_extract_regime_features(sample_market_data):
    index_df, vix_df = sample_market_data
    features = extract_regime_features(index_df, vix_df, window=20)
    assert isinstance(features, pd.DataFrame)
    assert not features.empty
    assert "log_return_20d" in features.columns
    assert "realized_vol_20d" in features.columns
    assert "parkinson_vol_20d" in features.columns
    assert "vix_level" in features.columns
    assert "vix_change_20d" in features.columns
    # Ensure no NaN rows after cleaning
    assert features.isna().sum().sum() == 0
