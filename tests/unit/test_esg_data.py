"""Unit tests for ESG Conscience Score dataset and universe integration."""

import pytest
from app.core.models import UniverseStock
from app.data.service import MarketDataService
from app.universe import (
    NIFTY50_CONSTITUENTS,
    get_esg_badge,
    get_esg_score_for_symbol,
    get_universe_metadata,
)


def test_esg_data_covers_all_50_nifty_constituents():
    """All 50 NIFTY constituents must have curated ESG scores."""
    assert len(NIFTY50_CONSTITUENTS) == 50
    for item in NIFTY50_CONSTITUENTS:
        sym = item["symbol"]
        esg = get_esg_score_for_symbol(sym)
        assert esg is not None, f"Missing ESG data for {sym}"
        for field in ("esg_composite", "esg_environment", "esg_social", "esg_governance"):
            assert field in esg, f"Missing {field} for {sym}"
            val = esg[field]
            assert isinstance(val, (int, float)), f"{field} for {sym} is not numeric: {val}"
            assert 0.0 <= val <= 100.0, f"{field} for {sym} out of range [0, 100]: {val}"


def test_esg_badge_thresholds():
    """Badge mapping must adhere to: 🟢 >= 70, 🟡 40-69, 🔴 < 40."""
    assert "🟢" in get_esg_badge(70.0)
    assert "🟢" in get_esg_badge(85.5)
    assert "🟡" in get_esg_badge(69.9)
    assert "🟡" in get_esg_badge(40.0)
    assert "🔴" in get_esg_badge(39.9)
    assert "🔴" in get_esg_badge(15.0)


def test_universe_stock_model_includes_esg_fields():
    """MarketDataService.get_universe() returns UniverseStock objects with populated ESG fields."""
    svc = MarketDataService()
    nifty_universe = svc.get_universe(include_benchmarks=False, include_expanded=False)
    assert len(nifty_universe) == 50

    universe = svc.get_universe(include_benchmarks=False)
    assert len(universe) == 58
    for stock in universe:
        assert isinstance(stock, UniverseStock)
        assert stock.esg_composite is not None
        assert 0.0 <= stock.esg_composite <= 100.0
        assert stock.esg_environment is not None
        assert stock.esg_social is not None
        assert stock.esg_governance is not None
