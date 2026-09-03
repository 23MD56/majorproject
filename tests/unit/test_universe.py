import pytest
from app.universe import (
    NIFTY50_CONSTITUENTS,
    BENCHMARK_SYMBOLS,
    get_universe_symbols,
    get_universe_metadata,
    normalize_symbol,
    denormalize_symbol,
    get_sector_for_symbol,
    is_valid_symbol,
)


def test_nifty50_constituents_has_50_stocks():
    assert len(NIFTY50_CONSTITUENTS) == 50
    # Every constituent must have symbol, name, and sector
    for item in NIFTY50_CONSTITUENTS:
        assert "symbol" in item
        assert "name" in item
        assert "sector" in item
        assert len(item["symbol"]) > 0
        assert len(item["name"]) > 0
        assert len(item["sector"]) > 0


def test_benchmark_symbols_present():
    assert "^NSEI" in BENCHMARK_SYMBOLS
    assert "^INDIAVIX" in BENCHMARK_SYMBOLS


def test_get_universe_symbols():
    # NIFTY 50 unexpanded
    nifty_symbols = get_universe_symbols(include_benchmarks=False, include_expanded=False)
    assert len(nifty_symbols) == 50

    # Expanded Multi-Asset Universe (58 assets)
    symbols = get_universe_symbols(include_benchmarks=False)
    assert len(symbols) == 58
    assert "RELIANCE" in symbols
    assert "TCS" in symbols
    assert "INFY" in symbols
    assert "HDFCBANK" in symbols
    assert "GOLDBEES" in symbols
    assert "HAL" in symbols

    symbols_with_benchmarks = get_universe_symbols(include_benchmarks=True)
    assert len(symbols_with_benchmarks) == 60
    assert "^NSEI" in symbols_with_benchmarks
    assert "^INDIAVIX" in symbols_with_benchmarks


def test_normalize_symbol():
    # Should convert various formats to canonical NSE symbol
    assert normalize_symbol("reliance") == "RELIANCE"
    assert normalize_symbol("RELIANCE.NS") == "RELIANCE"
    assert normalize_symbol("TCS.BO") == "TCS"
    assert normalize_symbol("^NSEI") == "^NSEI"
    assert normalize_symbol("^INDIAVIX") == "^INDIAVIX"


def test_denormalize_symbol_for_provider():
    # For Yahoo Finance, standard stocks get .NS suffix, benchmark indices keep caret
    assert denormalize_symbol("RELIANCE", provider="yahoo") == "RELIANCE.NS"
    assert denormalize_symbol("INFY", provider="yahoo") == "INFY.NS"
    assert denormalize_symbol("^NSEI", provider="yahoo") == "^NSEI"
    assert denormalize_symbol("^INDIAVIX", provider="yahoo") == "^INDIAVIX"


def test_get_sector_for_symbol():
    assert get_sector_for_symbol("INFY") == "Information Technology"
    assert get_sector_for_symbol("HDFCBANK") == "Financial Services"
    assert get_sector_for_symbol("RELIANCE") == "Energy & Oil"
    assert get_sector_for_symbol("INVALID_TICKER") is None


def test_is_valid_symbol():
    assert is_valid_symbol("RELIANCE") is True
    assert is_valid_symbol("RELIANCE.NS") is True
    assert is_valid_symbol("^NSEI") is True
    assert is_valid_symbol("NON_EXISTENT_CO") is False


def test_get_universe_metadata():
    # NIFTY 50 unexpanded
    nifty_meta = get_universe_metadata(include_expanded=False)
    assert len(nifty_meta) == 50

    # Expanded universe (58 assets)
    metadata = get_universe_metadata()
    assert len(metadata) == 58
    sectors = {m["sector"] for m in metadata}
    assert "Information Technology" in sectors
    assert "Financial Services" in sectors
    assert "Commodities" in sectors
    assert "Defense" in sectors
    assert "Metals" in sectors
