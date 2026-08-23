"""Data validation, anomaly cleaning, date alignment, and returns calculation."""

import numpy as np
import pandas as pd
from typing import List, Optional, Union


def sanitize_raw_provider_data(df: pd.DataFrame) -> pd.DataFrame:
    """Standardize column names, remove duplicate index timestamps, and format DataFrame."""
    if df.empty:
        return pd.DataFrame()

    out = df.copy()

    # Flatten multi-index columns if returned by yfinance
    if isinstance(out.columns, pd.MultiIndex):
        out.columns = [col[0] for col in out.columns]

    # Map column names to lowercase standard names
    col_rename = {}
    for col in out.columns:
        col_lower = str(col).strip().lower()
        if "open" in col_lower:
            col_rename[col] = "open"
        elif "high" in col_lower:
            col_rename[col] = "high"
        elif "low" in col_lower:
            col_rename[col] = "low"
        elif "adj" in col_lower or "adjusted" in col_lower:
            col_rename[col] = "adj_close"
        elif "close" in col_lower:
            col_rename[col] = "close"
        elif "vol" in col_lower:
            col_rename[col] = "volume"
    out.rename(columns=col_rename, inplace=True)

    # Ensure adj_close exists (fallback to close if provider didn't supply separate adj_close)
    if "adj_close" not in out.columns and "close" in out.columns:
        out["adj_close"] = out["close"]

    # Ensure index is DatetimeIndex without timezone or converted to UTC/naive date
    if not isinstance(out.index, pd.DatetimeIndex):
        if "date" in [str(c).lower() for c in out.columns]:
            date_col = [c for c in out.columns if str(c).lower() == "date"][0]
            out.index = pd.to_datetime(out[date_col])
            out.drop(columns=[date_col], inplace=True)
        else:
            out.index = pd.to_datetime(out.index)

    if out.index.tz is not None:
        out.index = out.index.tz_localize(None)

    # Remove duplicate dates keeping the latest
    out = out[~out.index.duplicated(keep="last")]
    out.sort_index(inplace=True)

    return out


def validate_ohlcv_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Validate OHLCV data invariants and drop invalid or corrupted records.

    Invariants checked:
    - Required columns present: open, high, low, close, adj_close, volume
    - High >= Low
    - High >= max(Open, Close) * (1 - epsilon)
    - Low <= min(Open, Close) * (1 + epsilon)
    - Non-negative prices and volume
    - No NaNs in essential price columns
    """
    if df.empty:
        return pd.DataFrame()

    clean_df = sanitize_raw_provider_data(df)

    required_cols = ["open", "high", "low", "close", "adj_close", "volume"]
    for col in required_cols:
        if col not in clean_df.columns:
            return pd.DataFrame()

    # Convert columns to numeric
    for col in required_cols:
        clean_df[col] = pd.to_numeric(clean_df[col], errors="coerce")

    # Drop rows with NaN in open, high, low, close
    clean_df.dropna(subset=["open", "high", "low", "close"], inplace=True)

    if clean_df.empty:
        return clean_df

    # Invariant masks
    eps = 1e-4
    valid_mask = (
        (clean_df["open"] > 0)
        & (clean_df["high"] > 0)
        & (clean_df["low"] > 0)
        & (clean_df["close"] > 0)
        & (clean_df["volume"] >= 0)
        & (clean_df["high"] >= clean_df["low"] * (1 - eps))
        & (clean_df["high"] >= clean_df[["open", "close"]].max(axis=1) * (1 - eps))
        & (clean_df["low"] <= clean_df[["open", "close"]].min(axis=1) * (1 + eps))
    )

    clean_df = clean_df[valid_mask].copy()

    # Clean slight floating rounding on high/low bounds
    clean_df["high"] = clean_df[["high", "open", "close"]].max(axis=1)
    clean_df["low"] = clean_df[["low", "open", "close"]].min(axis=1)

    return clean_df


def align_to_trading_calendar(
    df: pd.DataFrame,
    benchmark_dates: Union[pd.DatetimeIndex, List[pd.Timestamp]],
    method: str = "ffill",
) -> pd.DataFrame:
    """Align asset OHLCV dataframe with canonical trading calendar.

    Missing trading dates are forward-filled (to prevent future lookahead bias)
    and trading volume for interpolated days is set to 0.
    """
    if df.empty:
        return pd.DataFrame()

    if not isinstance(benchmark_dates, pd.DatetimeIndex):
        benchmark_dates = pd.DatetimeIndex(benchmark_dates)

    if benchmark_dates.tz is not None:
        benchmark_dates = benchmark_dates.tz_localize(None)

    # Reindex against the calendar
    reindexed = df.reindex(benchmark_dates)

    # Identify which dates were missing
    missing_mask = reindexed["close"].isna()

    # Forward fill price data
    if method == "ffill":
        reindexed[["open", "high", "low", "close", "adj_close"]] = reindexed[
            ["open", "high", "low", "close", "adj_close"]
        ].ffill()
        # In case the first row was missing, backfill just the initial row
        reindexed[["open", "high", "low", "close", "adj_close"]] = reindexed[
            ["open", "high", "low", "close", "adj_close"]
        ].bfill()

    # Set volume for missing/interpolated days to 0.0
    reindexed.loc[missing_mask, "volume"] = 0.0

    return reindexed


def calculate_returns(
    df: pd.DataFrame,
    price_col: str = "adj_close",
) -> pd.DataFrame:
    """Calculate daily simple return, log return, and cumulative return series."""
    if df.empty or price_col not in df.columns:
        return df

    out = df.copy()
    prices = out[price_col]

    # Simple daily return: (P_t - P_{t-1}) / P_{t-1}
    daily_ret = prices.pct_change().fillna(0.0)

    # Log return: ln(P_t / P_{t-1})
    log_ret = np.log(prices / prices.shift(1)).fillna(0.0)

    # Cumulative return: (P_t - P_0) / P_0
    initial_price = prices.iloc[0] if len(prices) > 0 and prices.iloc[0] > 0 else 1.0
    cumulative_ret = (prices - initial_price) / initial_price

    out["daily_return"] = daily_ret
    out["log_return"] = log_ret
    out["cumulative_return"] = cumulative_ret

    return out
