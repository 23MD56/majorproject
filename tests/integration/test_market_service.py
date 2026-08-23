import pandas as pd
import pytest
from app.core.models import StockQuote, UniverseStock, SyncResult
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.universe import get_universe_symbols


@pytest.fixture
def mock_service(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    return MarketDataService(provider=provider, cache=cache)


def test_get_universe(mock_service):
    stocks = mock_service.get_universe(include_benchmarks=False)
    assert len(stocks) == 50
    assert all(isinstance(s, UniverseStock) for s in stocks)
    symbols = [s.symbol for s in stocks]
    assert "RELIANCE" in symbols
    assert "TCS" in symbols

    all_items = mock_service.get_universe(include_benchmarks=True)
    assert len(all_items) == 52
    bm_symbols = [s.symbol for s in all_items if s.is_benchmark]
    assert "^NSEI" in bm_symbols
    assert "^INDIAVIX" in bm_symbols


def test_get_history_with_mock_and_cache(mock_service):
    # First call: fetches from provider and saves to cache
    df = mock_service.get_history("RELIANCE", start_date="2025-01-01", end_date="2025-02-01")
    assert not df.empty
    assert "open" in df.columns
    assert "high" in df.columns
    assert "low" in df.columns
    assert "close" in df.columns
    assert "volume" in df.columns
    assert "daily_return" in df.columns

    # Verify cache has been populated
    assert mock_service.cache.has_valid_cache("RELIANCE")

    # Second call: loads from cache
    cached_df = mock_service.get_history("RELIANCE", start_date="2025-01-01", end_date="2025-02-01")
    assert len(cached_df) == len(df)
    assert cached_df.iloc[0]["close"] == df.iloc[0]["close"]


def test_get_daily_returns(mock_service):
    returns_series = mock_service.get_daily_returns("INFY", start_date="2025-01-01", end_date="2025-03-01")
    assert isinstance(returns_series, pd.Series)
    assert len(returns_series) > 0
    assert returns_series.isna().sum() == 0


def test_get_latest_quote(mock_service):
    quote = mock_service.get_latest_quote("TCS")
    assert isinstance(quote, StockQuote)
    assert quote.symbol == "TCS"
    assert quote.current_price > 0
    assert quote.sector == "Information Technology"
    assert quote.day_high >= quote.day_low


def test_get_aligned_dataset(mock_service):
    symbols = ["RELIANCE", "TCS", "INFY", "^NSEI"]
    matrix = mock_service.get_aligned_dataset(
        symbols=symbols,
        start_date="2025-01-01",
        end_date="2025-02-01",
        field="close",
    )
    assert isinstance(matrix, pd.DataFrame)
    assert set(matrix.columns) == set(symbols)
    # Check no missing values after calendar alignment and ffill
    assert matrix.isna().sum().sum() == 0
    assert len(matrix) > 10


def test_sync_universe_batch(mock_service):
    # Test batch sync for a subset of symbols
    subset = ["RELIANCE", "TCS", "^NSEI"]
    result = mock_service.sync_universe(
        symbols=subset,
        start_date="2025-01-01",
        end_date="2025-01-15",
    )
    assert isinstance(result, SyncResult)
    assert result.total_symbols == len(subset)
    assert result.successful_symbols == len(subset)
    assert len(result.failed_symbols) == 0
    for sym in subset:
        assert mock_service.cache.has_valid_cache(sym)
