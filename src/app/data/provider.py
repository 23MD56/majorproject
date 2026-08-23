"""Market data providers for QuantNiti (Yahoo Finance and Mock Provider)."""

import hashlib
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import numpy as np
import pandas as pd
import yfinance as yf

from app.data.cleaner import sanitize_raw_provider_data, validate_ohlcv_dataframe
from app.universe import denormalize_symbol, get_sector_for_symbol, normalize_symbol, _SYMBOL_MAP


class MarketDataProvider(ABC):
    """Abstract Base Class for Market Data Providers."""

    @abstractmethod
    def fetch_history(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: Optional[str] = None,
    ) -> pd.DataFrame:
        """Fetch historical daily OHLCV dataframe for a given symbol."""
        pass

    @abstractmethod
    def fetch_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetch latest market quote for a given symbol."""
        pass


class YahooFinanceProvider(MarketDataProvider):
    """Live/EOD market data provider fetching from Yahoo Finance."""

    def __init__(self, timeout: int = 15):
        self.timeout = timeout

    def fetch_history(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: Optional[str] = None,
    ) -> pd.DataFrame:
        """Download historical price bars using Yahoo Finance."""
        yf_symbol = denormalize_symbol(symbol, provider="yahoo")

        try:
            ticker = yf.Ticker(yf_symbol)
            if start_date or end_date:
                raw_df = ticker.history(
                    start=start_date,
                    end=end_date,
                    interval="1d",
                    auto_adjust=False,
                    timeout=self.timeout,
                )
            else:
                p = period if period else "5y"
                raw_df = ticker.history(
                    period=p,
                    interval="1d",
                    auto_adjust=False,
                    timeout=self.timeout,
                )

            if raw_df.empty:
                return pd.DataFrame()

            cleaned = validate_ohlcv_dataframe(raw_df)
            return cleaned
        except Exception:
            return pd.DataFrame()

    def fetch_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetch current quote using Yahoo Finance fast_info or history."""
        yf_symbol = denormalize_symbol(symbol, provider="yahoo")
        canonical = normalize_symbol(symbol)
        meta = _SYMBOL_MAP.get(canonical, {"name": canonical, "sector": "Unknown"})

        try:
            ticker = yf.Ticker(yf_symbol)
            fast = ticker.fast_info

            last_price = float(fast.last_price)
            prev_close = float(fast.previous_close)
            day_high = float(fast.day_high) if hasattr(fast, "day_high") and fast.day_high else last_price
            day_low = float(fast.day_low) if hasattr(fast, "day_low") and fast.day_low else last_price
            vol = float(fast.last_volume) if hasattr(fast, "last_volume") and fast.last_volume else 0.0

            change = last_price - prev_close
            change_pct = (change / prev_close * 100.0) if prev_close else 0.0

            return {
                "symbol": canonical,
                "name": meta.get("name", canonical),
                "sector": meta.get("sector", "Unknown"),
                "current_price": round(last_price, 2),
                "day_change": round(change, 2),
                "day_change_pct": round(change_pct, 2),
                "day_high": round(day_high, 2),
                "day_low": round(day_low, 2),
                "volume": vol,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "previous_close": round(prev_close, 2),
                "week_52_high": round(float(fast.year_high), 2) if hasattr(fast, "year_high") and fast.year_high else None,
                "week_52_low": round(float(fast.year_low), 2) if hasattr(fast, "year_low") and fast.year_low else None,
            }
        except Exception:
            # Fallback to last row of 5d history
            hist = self.fetch_history(symbol, period="5d")
            if not hist.empty:
                last_row = hist.iloc[-1]
                prev_row = hist.iloc[-2] if len(hist) > 1 else last_row
                change = last_row["close"] - prev_row["close"]
                change_pct = (change / prev_row["close"] * 100.0) if prev_row["close"] else 0.0

                return {
                    "symbol": canonical,
                    "name": meta.get("name", canonical),
                    "sector": meta.get("sector", "Unknown"),
                    "current_price": round(float(last_row["close"]), 2),
                    "day_change": round(float(change), 2),
                    "day_change_pct": round(float(change_pct), 2),
                    "day_high": round(float(last_row["high"]), 2),
                    "day_low": round(float(last_row["low"]), 2),
                    "volume": float(last_row["volume"]),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "previous_close": round(float(prev_row["close"]), 2),
                }

            raise RuntimeError(f"Unable to fetch live quote for {symbol}")


class MockDataProvider(MarketDataProvider):
    """Deterministic synthetic market data provider for offline testing and development."""

    def __init__(self, seed: int = 42):
        self.seed = seed

    def _get_symbol_seed(self, symbol: str) -> int:
        """Derive reproducible integer seed from symbol string."""
        return int(hashlib.md5(symbol.encode()).hexdigest()[:8], 16)

    def fetch_history(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: Optional[str] = None,
    ) -> pd.DataFrame:
        """Generate realistic synthetic daily OHLCV series for testing."""
        canonical = normalize_symbol(symbol)
        rng = np.random.default_rng(self._get_symbol_seed(canonical))

        # Base prices per asset class
        if canonical == "^NSEI":
            base_price = 24000.0
            volatility = 0.010
            drift = 0.0004
        elif canonical == "^INDIAVIX":
            base_price = 14.5
            volatility = 0.035
            drift = 0.0000
        else:
            base_price = float(rng.uniform(500.0, 3500.0))
            volatility = float(rng.uniform(0.012, 0.025))
            drift = float(rng.uniform(-0.0001, 0.0008))

        # Determine date range (business days only)
        end_dt = pd.to_datetime(end_date) if end_date else pd.Timestamp.now().normalize()
        if start_date:
            start_dt = pd.to_datetime(start_date)
        else:
            days = 365 * 5 if (not period or "5y" in period) else (365 if "1y" in period else 180)
            start_dt = end_dt - timedelta(days=days)

        bdate_range = pd.bdate_range(start=start_dt, end=end_dt)
        n = len(bdate_range)
        if n == 0:
            return pd.DataFrame()

        # Geometric random walk with market correlation for stocks
        if canonical not in ("^NSEI", "^INDIAVIX"):
            mkt_rng = np.random.default_rng(self._get_symbol_seed("^NSEI"))
            mkt_returns = mkt_rng.normal(loc=0.0004, scale=0.010, size=n)
            target_beta = float(rng.uniform(0.75, 1.35))
            idio_returns = rng.normal(loc=drift, scale=volatility * 0.7, size=n)
            daily_returns = target_beta * mkt_returns + idio_returns
        else:
            daily_returns = rng.normal(loc=drift, scale=volatility, size=n)

        price_series = base_price * np.exp(np.cumsum(daily_returns))

        # Generate realistic OHLC bars around close
        daily_noise = rng.uniform(0.002, 0.008, size=n)
        opens = price_series * (1 + rng.normal(0, 0.003, size=n))
        closes = price_series
        highs = np.maximum(opens, closes) * (1 + daily_noise)
        lows = np.minimum(opens, closes) * (1 - daily_noise)
        volumes = rng.integers(100_000, 5_000_000, size=n)

        df = pd.DataFrame(
            {
                "open": np.round(opens, 2),
                "high": np.round(highs, 2),
                "low": np.round(lows, 2),
                "close": np.round(closes, 2),
                "adj_close": np.round(closes, 2),
                "volume": volumes,
            },
            index=bdate_range,
        )

        return validate_ohlcv_dataframe(df)

    def fetch_quote(self, symbol: str) -> Dict[str, Any]:
        """Generate synthetic latest quote."""
        canonical = normalize_symbol(symbol)
        meta = _SYMBOL_MAP.get(canonical, {"name": canonical, "sector": "Unknown"})

        hist = self.fetch_history(symbol, period="5d")
        if hist.empty:
            raise RuntimeError(f"Could not generate quote for {symbol}")

        last_row = hist.iloc[-1]
        prev_row = hist.iloc[-2] if len(hist) > 1 else last_row

        change = last_row["close"] - prev_row["close"]
        change_pct = (change / prev_row["close"] * 100.0) if prev_row["close"] else 0.0

        return {
            "symbol": canonical,
            "name": meta.get("name", canonical),
            "sector": meta.get("sector", "Unknown"),
            "current_price": float(round(last_row["close"], 2)),
            "day_change": float(round(change, 2)),
            "day_change_pct": float(round(change_pct, 2)),
            "day_high": float(round(last_row["high"], 2)),
            "day_low": float(round(last_row["low"], 2)),
            "volume": float(last_row["volume"]),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "previous_close": float(round(prev_row["close"], 2)),
            "week_52_high": float(round(last_row["close"] * 1.25, 2)),
            "week_52_low": float(round(last_row["close"] * 0.80, 2)),
        }
