"""High-performance Parquet-based market data cache."""

import os
import time
from pathlib import Path
from typing import List, Optional, Union
import pandas as pd
from quantniti.core.config import settings
from quantniti.universe import normalize_symbol


class ParquetMarketCache:
    """Manages fast on-disk Parquet caching for historical OHLCV data."""

    def __init__(
        self,
        cache_dir: Optional[Union[str, Path]] = None,
        default_ttl_seconds: Optional[int] = None,
    ):
        self.cache_dir = Path(cache_dir) if cache_dir else settings.cache_dir
        self.default_ttl_seconds = (
            default_ttl_seconds
            if default_ttl_seconds is not None
            else settings.cache_ttl_seconds
        )
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_file_path(self, symbol: str) -> Path:
        """Derive safe file path for a symbol."""
        canonical = normalize_symbol(symbol)
        safe_sym = canonical.replace("^", "_").replace(":", "_").replace("/", "_")
        return self.cache_dir / f"{safe_sym}.parquet"

    def save_history(self, symbol: str, df: pd.DataFrame) -> Path:
        """Save OHLCV dataframe as a Parquet file."""
        if df.empty:
            raise ValueError(f"Cannot cache empty DataFrame for symbol {symbol}")

        file_path = self._get_file_path(symbol)
        # Ensure index is DatetimeIndex named 'date'
        save_df = df.copy()
        if not isinstance(save_df.index, pd.DatetimeIndex):
            save_df.index = pd.to_datetime(save_df.index)
        save_df.index.name = "date"

        # Save to parquet with pyarrow
        save_df.to_parquet(file_path, engine="pyarrow", index=True)
        return file_path

    def load_history(
        self,
        symbol: str,
        max_age_seconds: Optional[int] = None,
    ) -> Optional[pd.DataFrame]:
        """Load cached historical dataframe for a symbol if it exists and satisfies TTL."""
        file_path = self._get_file_path(symbol)
        if not file_path.exists():
            return None

        if max_age_seconds is not None:
            mtime = file_path.stat().st_mtime
            age = time.time() - mtime
            if age > max_age_seconds:
                return None

        try:
            df = pd.read_parquet(file_path, engine="pyarrow")
            if not isinstance(df.index, pd.DatetimeIndex):
                df.index = pd.to_datetime(df.index)
            df.sort_index(inplace=True)
            return df
        except Exception:
            return None

    def has_valid_cache(
        self,
        symbol: str,
        max_age_seconds: Optional[int] = None,
    ) -> bool:
        """Check if a symbol has an existing, unexpired cached file."""
        ttl = max_age_seconds if max_age_seconds is not None else self.default_ttl_seconds
        file_path = self._get_file_path(symbol)
        if not file_path.exists():
            return False

        if ttl is not None:
            age = time.time() - file_path.stat().st_mtime
            return age <= ttl

        return True

    def invalidate(self, symbol: Optional[str] = None) -> None:
        """Remove cached data for a specific symbol or all symbols."""
        if symbol:
            file_path = self._get_file_path(symbol)
            if file_path.exists():
                file_path.unlink()
        else:
            for p in self.cache_dir.glob("*.parquet"):
                try:
                    p.unlink()
                except OSError:
                    pass

    def get_cached_symbols(self) -> List[str]:
        """Return list of all cached symbols in the directory."""
        symbols = []
        for p in self.cache_dir.glob("*.parquet"):
            name = p.stem
            if name.startswith("_"):
                canonical = "^" + name[1:]
            else:
                canonical = name
            symbols.append(canonical)
        return sorted(symbols)
