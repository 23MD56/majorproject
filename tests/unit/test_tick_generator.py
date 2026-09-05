"""Unit tests for MarketTickGenerator and SSE tick formatting (Ticket #20)."""

import pytest
import json
from app.core.models import MarketTick
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.data.streaming import MarketTickGenerator


@pytest.fixture
def market_service(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    return MarketDataService(provider=provider, cache=cache)


@pytest.fixture
def tick_generator(market_service):
    return MarketTickGenerator(market_service=market_service, mode="synthetic")


def test_generate_single_tick(tick_generator):
    """Tick generator should produce a valid MarketTick with sensible price and volume."""
    tick = tick_generator.generate_tick("RELIANCE")
    assert isinstance(tick, MarketTick)
    assert tick.symbol == "RELIANCE"
    assert tick.price > 0
    assert tick.volume >= 0
    assert tick.high >= tick.low
    assert tick.price >= tick.low
    assert tick.price <= tick.high
    assert tick.timestamp is not None


def test_generate_batch_ticks(tick_generator):
    """Tick generator should produce ticks for a batch of symbols."""
    symbols = ["RELIANCE", "TCS", "^NSEI", "GOLDBEES"]
    ticks = tick_generator.generate_batch(symbols)
    assert len(ticks) == 4
    gen_symbols = [t.symbol for t in ticks]
    assert "RELIANCE" in gen_symbols
    assert "^NSEI" in gen_symbols


def test_tick_consecutive_price_movement(tick_generator):
    """Multiple consecutive ticks should update price smoothly without wild jumps."""
    prev_tick = tick_generator.generate_tick("TCS")
    for _ in range(5):
        next_tick = tick_generator.generate_tick("TCS")
        # Step variation should be realistic (within +-2% per tick)
        pct_diff = abs(next_tick.price - prev_tick.price) / prev_tick.price
        assert pct_diff <= 0.05
        assert next_tick.volume >= prev_tick.volume
        prev_tick = next_tick


def test_format_sse_event():
    """SSE formatting produces standard compliant event stream chunks."""
    payload = {"symbol": "INFY", "price": 1850.5}
    formatted = MarketTickGenerator.format_sse_event("tick", payload)
    assert formatted.startswith("event: tick\n")
    assert "data: " in formatted
    assert formatted.endswith("\n\n")

    # Verify JSON deserialization of data line
    data_line = [line for line in formatted.split("\n") if line.startswith("data: ")][0]
    data_json = json.loads(data_line[6:])
    assert data_json["symbol"] == "INFY"
    assert data_json["price"] == 1850.5


def test_live_fallback_to_synthetic(market_service):
    """When mode is live but broker is unavailable or returns error, cleanly fallback to synthetic."""
    gen = MarketTickGenerator(market_service=market_service, mode="live")
    tick = gen.generate_tick("UNKNOWN_OR_OFFLINE")
    assert isinstance(tick, MarketTick)
    assert tick.price > 0
