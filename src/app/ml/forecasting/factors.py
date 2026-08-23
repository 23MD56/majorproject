"""Quantitative multi-factor extraction engine for equity assets."""

from typing import Any, Dict, Optional, Tuple
import numpy as np
import pandas as pd


def compute_ema(series: pd.Series, span: int) -> pd.Series:
    """Compute Exponential Moving Average (EMA)."""
    return series.ewm(span=span, adjust=False).mean()


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Compute Relative Strength Index (RSI)."""
    delta = series.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)

    # Wilder's exponential smoothing
    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()

    rs = avg_gain / (avg_loss + 1e-9)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi


def compute_macd(
    series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """Compute MACD line, Signal line, and MACD Histogram."""
    ema_fast = compute_ema(series, span=fast)
    ema_slow = compute_ema(series, span=slow)
    macd_line = ema_fast - ema_slow
    signal_line = compute_ema(macd_line, span=signal)
    hist = macd_line - signal_line
    return macd_line, signal_line, hist


def compute_bollinger_bands(
    series: pd.Series, period: int = 20, std_dev: float = 2.0
) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    """Compute Upper, Middle, Lower Bollinger Bands and %B position."""
    mid = series.rolling(window=period).mean()
    rolling_std = series.rolling(window=period).std()
    upper = mid + (rolling_std * std_dev)
    lower = mid - (rolling_std * std_dev)
    band_width = upper - lower
    pct_b = (series - lower) / (band_width + 1e-9)
    return upper, mid, lower, pct_b


def compute_max_drawdown(series: pd.Series) -> float:
    """Compute historical maximum drawdown as a negative float (e.g. -0.15 for -15%)."""
    if series.empty:
        return 0.0
    rolling_max = series.cummax()
    drawdowns = (series - rolling_max) / (rolling_max + 1e-9)
    return float(drawdowns.min())


def compute_stock_beta_and_alpha(
    stock_returns: pd.Series,
    benchmark_returns: pd.Series,
    risk_free_rate: float = 0.065,
) -> Tuple[float, float, float]:
    """Compute Capital Asset Pricing Model (CAPM) Beta, Annualized Alpha, and Correlation."""
    aligned = pd.concat([stock_returns, benchmark_returns], axis=1).dropna()
    if len(aligned) < 20:
        return 1.0, 0.0, 0.5

    s_ret = aligned.iloc[:, 0]
    b_ret = aligned.iloc[:, 1]

    cov_matrix = np.cov(s_ret, b_ret)
    b_var = cov_matrix[1, 1]
    if b_var < 1e-9:
        return 1.0, 0.0, 0.5

    beta = float(cov_matrix[0, 1] / b_var)

    # Correlation
    corr_matrix = np.corrcoef(s_ret, b_ret)
    corr = float(corr_matrix[0, 1]) if not np.isnan(corr_matrix[0, 1]) else 0.5

    # Annualized Alpha = (Stock CAGR) - [Rf + Beta * (Benchmark CAGR - Rf)]
    daily_rf = (1.0 + risk_free_rate) ** (1.0 / 252.0) - 1.0
    stock_mean_daily = s_ret.mean()
    bench_mean_daily = b_ret.mean()

    alpha_daily = stock_mean_daily - (daily_rf + beta * (bench_mean_daily - daily_rf))
    alpha_annualized = float(alpha_daily * 252.0)

    return round(beta, 3), round(alpha_annualized, 4), round(corr, 3)


def extract_stock_factors(
    stock_df: pd.DataFrame,
    index_df: Optional[pd.DataFrame] = None,
) -> Dict[str, Any]:
    """Extract comprehensive multi-factor technical, momentum, and risk indicators."""
    if stock_df.empty:
        return {}

    close = stock_df["close"]
    high = stock_df["high"]
    low = stock_df["low"]
    volume = stock_df["volume"]

    # Daily returns
    stock_returns = close.pct_change().dropna()

    # 1. Momentum Returns across horizons (1M=21d, 3M=63d, 6M=126d, 12M=252d)
    mom_1m = float(close.pct_change(periods=min(21, len(close) - 1)).iloc[-1]) if len(close) > 21 else 0.0
    mom_3m = float(close.pct_change(periods=min(63, len(close) - 1)).iloc[-1]) if len(close) > 63 else mom_1m
    mom_6m = float(close.pct_change(periods=min(126, len(close) - 1)).iloc[-1]) if len(close) > 126 else mom_3m
    mom_12m = float(close.pct_change(periods=min(252, len(close) - 1)).iloc[-1]) if len(close) > 252 else mom_6m

    # 2. Oscillators & Technicals
    rsi_series = compute_rsi(close, period=14)
    rsi_val = float(rsi_series.dropna().iloc[-1]) if not rsi_series.dropna().empty else 50.0

    macd_line, signal_line, macd_hist = compute_macd(close)
    macd_val = float(macd_line.iloc[-1]) if not macd_line.empty else 0.0
    macd_hist_val = float(macd_hist.iloc[-1]) if not macd_hist.empty else 0.0

    upper_bb, mid_bb, lower_bb, pct_b = compute_bollinger_bands(close, period=20)
    pct_b_val = float(pct_b.dropna().iloc[-1]) if not pct_b.dropna().empty else 0.5

    # 3. Moving Average Spreads
    ema_20 = compute_ema(close, 20).iloc[-1]
    ema_50 = compute_ema(close, 50).iloc[-1]
    ema_200 = compute_ema(close, 200).iloc[-1] if len(close) >= 200 else ema_50

    ema_20_50_spread = float((ema_20 - ema_50) / ema_50)
    ema_50_200_spread = float((ema_50 - ema_200) / ema_200)

    # 4. Volatility & Risk
    rvol_30d = float(stock_returns.rolling(window=min(30, len(stock_returns))).std().iloc[-1] * np.sqrt(252))
    rvol_90d = float(stock_returns.rolling(window=min(90, len(stock_returns))).std().iloc[-1] * np.sqrt(252))
    mdd_1y = compute_max_drawdown(close.iloc[-252:] if len(close) >= 252 else close)

    # 5. Market Beta & Alpha
    if index_df is not None and not index_df.empty:
        idx_returns = index_df["close"].pct_change().dropna()
        beta, alpha, corr = compute_stock_beta_and_alpha(stock_returns, idx_returns)
    else:
        beta, alpha, corr = 1.0, 0.0, 0.65

    return {
        "rsi_14": round(rsi_val, 2),
        "macd": round(macd_val, 2),
        "macd_hist": round(macd_hist_val, 2),
        "bollinger_pct_b": round(pct_b_val, 3),
        "ema_20_50_spread": round(ema_20_50_spread, 4),
        "ema_50_200_spread": round(ema_50_200_spread, 4),
        "momentum_1m": round(mom_1m, 4),
        "momentum_3m": round(mom_3m, 4),
        "momentum_6m": round(mom_6m, 4),
        "momentum_12m": round(mom_12m, 4),
        "realized_vol_30d": round(rvol_30d, 4),
        "realized_vol_90d": round(rvol_90d, 4),
        "max_drawdown_1y": round(mdd_1y, 4),
        "beta": beta,
        "alpha_annualized": alpha,
        "market_correlation": corr,
    }
