"""Unit tests for Multi-Asset Universe Expansion (Ticket 17).

Verifies asset taxonomy (EQUITY, COMMODITY_ETF, SECTORAL), constituent mappings,
historical OHLCV data existence, multi-horizon factor extraction, and HRP allocation.
"""

import numpy as np
import pandas as pd
import pytest

from app.core.models import AssetClass, RiskPersona
from app.data.service import MarketDataService
from app.ml.forecasting.factors import extract_stock_factors
from app.ml.portfolio.hrp import HRPOptimizer, compute_shrunk_covariance
from app.universe import (
    COMMODITY_ETF_CONSTITUENTS,
    DEFENSE_CONSTITUENTS,
    METALS_CONSTITUENTS,
    NIFTY50_CONSTITUENTS,
    denormalize_symbol,
    get_asset_class_for_symbol,
    get_sector_for_symbol,
    get_universe_metadata,
    get_universe_symbols,
    is_valid_symbol,
    normalize_symbol,
)


# ==========================================
# Slice 1: Asset Taxonomy & Constituents
# ==========================================

def test_asset_class_enum_members():
    """Taxonomy must define EQUITY, COMMODITY_ETF, and SECTORAL."""
    assert AssetClass.EQUITY == "EQUITY"
    assert AssetClass.COMMODITY_ETF == "COMMODITY_ETF"
    assert AssetClass.SECTORAL == "SECTORAL"


def test_commodity_etfs_constituents():
    """Gold and Silver ETFs must be present with COMMODITY_ETF taxonomy."""
    etf_symbols = {item["symbol"] for item in COMMODITY_ETF_CONSTITUENTS}
    assert "GOLDBEES" in etf_symbols
    assert "SILVERBEES" in etf_symbols
    for item in COMMODITY_ETF_CONSTITUENTS:
        assert item["asset_class"] == AssetClass.COMMODITY_ETF
        assert item["sector"] == "Commodities"


def test_defense_constituents():
    """Defense equities must be present with SECTORAL taxonomy."""
    defense_symbols = {item["symbol"] for item in DEFENSE_CONSTITUENTS}
    expected = {"HAL", "BEL", "BDL", "MAZDOCK", "COCHINSHIP"}
    assert expected.issubset(defense_symbols)
    for item in DEFENSE_CONSTITUENTS:
        assert item["asset_class"] == AssetClass.SECTORAL
        assert item["sector"] == "Defense"


def test_metals_constituents():
    """Metals equities must be present with SECTORAL taxonomy."""
    metals_symbols = {item["symbol"] for item in METALS_CONSTITUENTS}
    expected = {"TATASTEEL", "HINDALCO", "JSWSTEEL", "VEDL", "JINDALSTEL"}
    assert expected.issubset(metals_symbols)
    for item in METALS_CONSTITUENTS:
        assert item["asset_class"] == AssetClass.SECTORAL
        assert item["sector"] in ("Metals", "Metals & Mining")


def test_expanded_universe_total_count():
    """Expanded universe must contain 58 unique investable assets (50 NIFTY + 8 new)."""
    symbols = get_universe_symbols(include_benchmarks=False)
    assert len(symbols) == 58
    assert len(set(symbols)) == 58  # Deduplicated

    symbols_with_bm = get_universe_symbols(include_benchmarks=True)
    assert len(symbols_with_bm) == 60


def test_symbol_normalization_and_validation():
    """Normalization and validation must recognize all multi-asset symbols."""
    new_tickers = [
        "GOLDBEES", "SILVERBEES", "HAL", "BDL", "MAZDOCK", "COCHINSHIP", "VEDL", "JINDALSTEL"
    ]
    for sym in new_tickers:
        assert is_valid_symbol(sym) is True
        assert is_valid_symbol(f"{sym}.NS") is True
        assert normalize_symbol(f"{sym}.ns") == sym
        assert denormalize_symbol(sym, provider="yahoo") == f"{sym}.NS"


def test_taxonomy_and_sector_lookup_helpers():
    """Lookup helpers return accurate asset class and sector."""
    assert get_asset_class_for_symbol("GOLDBEES") == AssetClass.COMMODITY_ETF
    assert get_asset_class_for_symbol("SILVERBEES") == AssetClass.COMMODITY_ETF
    assert get_asset_class_for_symbol("HAL") == AssetClass.SECTORAL
    assert get_asset_class_for_symbol("VEDL") == AssetClass.SECTORAL
    assert get_asset_class_for_symbol("RELIANCE") == AssetClass.EQUITY

    assert get_sector_for_symbol("GOLDBEES") == "Commodities"
    assert get_sector_for_symbol("HAL") == "Defense"
    assert get_sector_for_symbol("VEDL") == "Metals"


# ==========================================
# Slice 2: Historical Data & Factors
# ==========================================

def test_historical_ohlcv_data_exists_for_all_assets():
    """Every asset in the 58-asset universe must have accessible historical OHLCV data."""
    market_svc = MarketDataService()
    symbols = get_universe_symbols(include_benchmarks=False)
    for sym in symbols:
        df = market_svc.get_history(sym)
        assert not df.empty, f"Historical dataframe for {sym} is empty"
        assert len(df) >= 250, f"History for {sym} has only {len(df)} bars, expected >= 250"
        for col in ("open", "high", "low", "close", "volume"):
            assert col in df.columns, f"Missing {col} in {sym}"


def test_factor_extractor_on_multi_asset_universe():
    """Factors must be successfully extracted for ETFs, Defense, and Metals."""
    market_svc = MarketDataService()
    index_df = market_svc.get_history("^NSEI")
    test_assets = ["GOLDBEES", "SILVERBEES", "HAL", "COCHINSHIP", "VEDL"]

    for sym in test_assets:
        stock_df = market_svc.get_history(sym)
        factors = extract_stock_factors(stock_df, index_df)
        assert len(factors) > 0
        assert "beta" in factors
        assert "momentum_1m" in factors
        assert "momentum_6m" in factors
        assert "realized_vol_30d" in factors
        assert "realized_vol_90d" in factors
        assert np.isfinite(factors["beta"])
        assert np.isfinite(factors["realized_vol_30d"])

    # Commodity Gold ETF should have significantly lower equity beta than high-beta equity (e.g. HAL)
    gold_factors = extract_stock_factors(market_svc.get_history("GOLDBEES"), index_df)
    hal_factors = extract_stock_factors(market_svc.get_history("HAL"), index_df)
    assert gold_factors["beta"] < hal_factors["beta"]
    assert gold_factors["beta"] < 0.5  # Gold has low correlation to NIFTY


# ==========================================
# Slice 3: Covariance Shrinkage & HRP Allocation
# ==========================================

def test_ledoit_wolf_covariance_on_multi_asset_matrix():
    """Covariance computation with Ledoit-Wolf shrinkage succeeds on multi-asset returns."""
    market_svc = MarketDataService()
    assets = ["RELIANCE", "TCS", "GOLDBEES", "SILVERBEES", "HAL", "VEDL"]
    aligned_df = market_svc.get_aligned_dataset(assets, field="close")
    returns_df = aligned_df.pct_change().dropna()

    cov_matrix, shrinkage = compute_shrunk_covariance(returns_df, use_shrinkage=True)
    assert cov_matrix.shape == (len(assets), len(assets))
    assert np.all(np.isfinite(cov_matrix))
    assert 0.0 <= shrinkage <= 1.0
    # Symmetric check
    assert np.allclose(cov_matrix, cov_matrix.T)


def test_hrp_optimization_allocates_defensive_weight_to_gold():
    """HRP must allocate non-zero weight to Gold ETF due to its low variance and low correlation."""
    market_svc = MarketDataService()
    assets = ["RELIANCE", "INFY", "TATASTEEL", "HAL", "GOLDBEES"]
    aligned_df = market_svc.get_aligned_dataset(assets, field="close")
    returns_df = aligned_df.pct_change().dropna()

    optimizer = HRPOptimizer()
    weights = optimizer.optimize(
        returns_df=returns_df,
        risk_persona=RiskPersona.CONSERVATIVE,
    )
    assert sum(weights.values()) == pytest.approx(1.0, rel=1e-4)
    assert "GOLDBEES" in weights
    assert weights["GOLDBEES"] > 0.05, f"Gold ETF allocated too low weight: {weights['GOLDBEES']}"
