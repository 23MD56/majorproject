"""Feature engineering for unsupervised market regime detection."""

import numpy as np
import pandas as pd
from typing import Optional


def calculate_rolling_log_returns(series: pd.Series, window: int = 20) -> pd.Series:
    """Calculate rolling cumulative log return over a specified window."""
    daily_log_returns = np.log(series / series.shift(1))
    return daily_log_returns.rolling(window=window).sum()


def calculate_realized_volatility(
    series: pd.Series, window: int = 20, annualize: bool = True
) -> pd.Series:
    """Calculate rolling realized volatility of daily log returns."""
    daily_log_returns = np.log(series / series.shift(1))
    vol = daily_log_returns.rolling(window=window).std()
    if annualize:
        vol = vol * np.sqrt(252)
    return vol


def calculate_parkinson_volatility(
    high: pd.Series, low: pd.Series, window: int = 20, annualize: bool = True
) -> pd.Series:
    """Calculate Parkinson high-low rolling volatility estimate."""
    log_hl = np.log(high / low)
    factor = 1.0 / (4.0 * np.log(2.0))
    daily_parkinson_var = factor * (log_hl**2)
    rolling_var = daily_parkinson_var.rolling(window=window).mean()
    pvol = np.sqrt(rolling_var)
    if annualize:
        pvol = pvol * np.sqrt(252)
    return pvol


def extract_regime_features(
    index_df: pd.DataFrame,
    vix_df: Optional[pd.DataFrame] = None,
    window: int = 20,
) -> pd.DataFrame:
    """Extract and align multi-dimensional feature set for market regime clustering.

    Features generated:
    - log_return_20d: 20-day cumulative log return of index
    - log_return_50d: 50-day cumulative log return of index
    - realized_vol_20d: 20-day annualized realized volatility
    - parkinson_vol_20d: 20-day annualized Parkinson volatility
    - vix_level: India VIX close level (or realized vol proxy if vix_df missing)
    - vix_change_20d: 20-day absolute change in VIX
    """
    if index_df.empty:
        return pd.DataFrame()

    close = index_df["close"]
    high = index_df["high"]
    low = index_df["low"]

    features = pd.DataFrame(index=index_df.index)

    features["log_return_20d"] = calculate_rolling_log_returns(close, window=window)
    features["log_return_50d"] = calculate_rolling_log_returns(close, window=50)
    features["realized_vol_20d"] = calculate_realized_volatility(close, window=window, annualize=True)
    features["parkinson_vol_20d"] = calculate_parkinson_volatility(high, low, window=window, annualize=True)

    if vix_df is not None and not vix_df.empty:
        # Align VIX to index dates
        aligned_vix = vix_df["close"].reindex(index_df.index).ffill().bfill()
        features["vix_level"] = aligned_vix
        features["vix_change_20d"] = aligned_vix.diff(periods=window).fillna(0.0)
    else:
        # Fallback proxy if VIX is unavailable
        features["vix_level"] = features["realized_vol_20d"] * 100.0
        features["vix_change_20d"] = features["vix_level"].diff(periods=window).fillna(0.0)

    # Drop warm-up NaN rows
    features.dropna(inplace=True)
    return features
