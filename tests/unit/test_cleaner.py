import pandas as pd
import numpy as np
import pytest
from datetime import datetime, timezone
from quantniti.core.models import OHLCVBar, StockQuote, UniverseStock
from quantniti.data.cleaner import (
    validate_ohlcv_dataframe,
    align_to_trading_calendar,
    calculate_returns,
    sanitize_raw_provider_data,
)


def test_models_validation():
    # OHLCVBar validation
    bar = OHLCVBar(
        date="2026-01-02",
        open=2500.0,
        high=2550.0,
        low=2490.0,
        close=2540.0,
        adj_close=2540.0,
        volume=1200000,
        return_pct=0.016,
        log_return=0.01587,
    )
    assert bar.close == 2540.0
    assert bar.high >= bar.low

    # StockQuote validation
    quote = StockQuote(
        symbol="RELIANCE",
        name="Reliance Industries Ltd.",
        sector="Energy & Oil",
        current_price=2540.0,
        day_change=40.0,
        day_change_pct=1.6,
        day_high=2550.0,
        day_low=2490.0,
        volume=1200000,
        timestamp="2026-01-02T15:30:00Z",
    )
    assert quote.symbol == "RELIANCE"
    assert quote.day_change_pct == 1.6


def test_validate_ohlcv_dataframe_valid_data():
    dates = pd.date_range("2026-01-01", periods=5, freq="D")
    df = pd.DataFrame(
        {
            "Open": [100.0, 102.0, 101.0, 103.0, 105.0],
            "High": [105.0, 106.0, 104.0, 107.0, 108.0],
            "Low": [99.0, 101.0, 100.0, 102.0, 104.0],
            "Close": [102.0, 101.0, 103.0, 105.0, 107.0],
            "Adj Close": [102.0, 101.0, 103.0, 105.0, 107.0],
            "Volume": [1000, 1500, 1200, 1800, 2000],
        },
        index=dates,
    )

    clean_df = validate_ohlcv_dataframe(df)
    assert len(clean_df) == 5
    assert "open" in clean_df.columns
    assert "high" in clean_df.columns
    assert "low" in clean_df.columns
    assert "close" in clean_df.columns
    assert "adj_close" in clean_df.columns
    assert "volume" in clean_df.columns


def test_validate_ohlcv_dataframe_drops_invalid_rows():
    dates = pd.date_range("2026-01-01", periods=4, freq="D")
    df = pd.DataFrame(
        {
            "open": [100.0, 100.0, np.nan, 100.0],
            "high": [105.0, 90.0, 105.0, 105.0],  # row 1: high (90) < low (95) invalid!
            "low": [95.0, 95.0, 95.0, -10.0],     # row 3: negative low invalid!
            "close": [102.0, 92.0, 100.0, 100.0],
            "adj_close": [102.0, 92.0, 100.0, 100.0],
            "volume": [1000, 1000, 1000, 1000],
        },
        index=dates,
    )

    clean_df = validate_ohlcv_dataframe(df)
    # Only row 0 is valid
    assert len(clean_df) == 1
    assert clean_df.index[0] == dates[0]


def test_calculate_returns():
    dates = pd.date_range("2026-01-01", periods=3, freq="D")
    df = pd.DataFrame(
        {
            "open": [100.0, 110.0, 121.0],
            "high": [105.0, 115.0, 125.0],
            "low": [95.0, 105.0, 115.0],
            "close": [100.0, 110.0, 121.0],
            "adj_close": [100.0, 110.0, 121.0],
            "volume": [1000, 1000, 1000],
        },
        index=dates,
    )

    res = calculate_returns(df)
    assert "daily_return" in res.columns
    assert "log_return" in res.columns
    assert "cumulative_return" in res.columns

    # First row return is 0.0 (or NaN filled as 0)
    assert res["daily_return"].iloc[0] == 0.0
    # Second row: 110/100 - 1 = 0.10 (10%)
    assert pytest.approx(res["daily_return"].iloc[1], 1e-4) == 0.10
    # Third row: 121/110 - 1 = 0.10 (10%)
    assert pytest.approx(res["daily_return"].iloc[2], 1e-4) == 0.10

    # Cumulative return at step 3 is (121 - 100)/100 = 0.21 (21%)
    assert pytest.approx(res["cumulative_return"].iloc[2], 1e-4) == 0.21


def test_align_to_trading_calendar():
    # Benchmark dates (e.g. 5 trading days)
    cal = pd.date_range("2026-01-01", periods=5, freq="D")

    # Asset missing day 2 (index 1)
    asset_dates = [cal[0], cal[2], cal[3], cal[4]]
    df = pd.DataFrame(
        {
            "open": [100.0, 110.0, 115.0, 120.0],
            "high": [105.0, 115.0, 120.0, 125.0],
            "low": [95.0, 105.0, 110.0, 115.0],
            "close": [100.0, 110.0, 115.0, 120.0],
            "adj_close": [100.0, 110.0, 115.0, 120.0],
            "volume": [1000, 1500, 1200, 1300],
        },
        index=pd.DatetimeIndex(asset_dates),
    )

    aligned = align_to_trading_calendar(df, cal)
    assert len(aligned) == 5
    # Day 1 should be forward-filled from Day 0
    assert aligned.loc[cal[1], "close"] == 100.0
    # Forward-filled volume should be 0
    assert aligned.loc[cal[1], "volume"] == 0.0
