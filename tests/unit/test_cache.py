import time
from pathlib import Path
import pandas as pd
import pytest
from app.data.cache import ParquetMarketCache


@pytest.fixture
def temp_cache_dir(tmp_path):
    return tmp_path / "market_cache"


@pytest.fixture
def sample_df():
    dates = pd.date_range("2026-01-01", periods=10, freq="D")
    return pd.DataFrame(
        {
            "open": [100.0 + i for i in range(10)],
            "high": [105.0 + i for i in range(10)],
            "low": [95.0 + i for i in range(10)],
            "close": [102.0 + i for i in range(10)],
            "adj_close": [102.0 + i for i in range(10)],
            "volume": [1000 + i * 100 for i in range(10)],
        },
        index=dates,
    )


def test_cache_save_and_load(temp_cache_dir, sample_df):
    cache = ParquetMarketCache(cache_dir=temp_cache_dir)
    assert not cache.has_valid_cache("RELIANCE")

    cache.save_history("RELIANCE", sample_df)
    assert cache.has_valid_cache("RELIANCE")

    loaded = cache.load_history("RELIANCE")
    assert loaded is not None
    assert len(loaded) == 10
    assert "close" in loaded.columns
    assert loaded.loc[sample_df.index[0], "close"] == 102.0


def test_cache_ttl_expiration(temp_cache_dir, sample_df):
    cache = ParquetMarketCache(cache_dir=temp_cache_dir, default_ttl_seconds=1)
    cache.save_history("INFY", sample_df)

    # Immediately valid
    assert cache.has_valid_cache("INFY")

    # After TTL expired
    time.sleep(1.2)
    assert not cache.has_valid_cache("INFY")
    # Explicit load with strict max_age
    assert cache.load_history("INFY", max_age_seconds=1) is None
    # Loading without max_age still returns stored data
    assert cache.load_history("INFY", max_age_seconds=None) is not None


def test_cache_invalidation(temp_cache_dir, sample_df):
    cache = ParquetMarketCache(cache_dir=temp_cache_dir)
    cache.save_history("TCS", sample_df)
    cache.save_history("HDFCBANK", sample_df)

    assert set(cache.get_cached_symbols()) == {"TCS", "HDFCBANK"}

    # Invalidate single symbol
    cache.invalidate("TCS")
    assert not cache.has_valid_cache("TCS")
    assert cache.has_valid_cache("HDFCBANK")

    # Invalidate all
    cache.invalidate()
    assert len(cache.get_cached_symbols()) == 0
