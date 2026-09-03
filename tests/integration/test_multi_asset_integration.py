"""Integration tests for Multi-Asset Universe Expansion (Ticket 17).

Tests Explore API filtering across themes (Defense, Metals, Commodities),
asset class query parameters, 360-degree profiles for ETFs and defense equities,
and end-to-end Grow basket recommendation in high-volatility regimes.
"""

from unittest.mock import MagicMock
import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.core.config import settings
from app.core.models import (
    AssetClass,
    CurrentRegimeResponse,
    MarketRegimeType,
    RegimeProbabilities,
    RiskPersona,
)
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.ml.forecasting.service import ExploreService
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService


@pytest.fixture
def integration_app(tmp_path):
    """Construct real service instances for multi-asset integration tests."""
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    market_svc = MarketDataService(provider=provider, cache=cache)
    regime_svc = RegimeService(market_service=market_svc)
    explore_svc = ExploreService(market_service=market_svc, regime_service=regime_svc)
    grow_svc = GrowService(
        market_service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
    )
    return create_app(
        service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
        grow_service=grow_svc,
    )


@pytest.mark.asyncio
async def test_explore_stocks_total_and_asset_class_filter(integration_app):
    """Verify that all 58 assets are available and asset_class filter works."""
    transport = ASGITransport(app=integration_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Full universe
        res = await client.get(f"{settings.api_v1_prefix}/explore/stocks")
        assert res.status_code == 200
        all_stocks = res.json()
        assert len(all_stocks) == 58

        # Filter by COMMODITY_ETF
        res_etf = await client.get(f"{settings.api_v1_prefix}/explore/stocks?asset_class=COMMODITY_ETF")
        assert res_etf.status_code == 200
        etfs = res_etf.json()
        assert len(etfs) == 2
        symbols = {e["symbol"] for e in etfs}
        assert symbols == {"GOLDBEES", "SILVERBEES"}
        for item in etfs:
            assert item["asset_class"] == AssetClass.COMMODITY_ETF


@pytest.mark.asyncio
async def test_explore_theme_filter_chips(integration_app):
    """Verify Defense, Metals, and Commodities sector filter chips."""
    transport = ASGITransport(app=integration_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Defense
        res_def = await client.get(f"{settings.api_v1_prefix}/explore/stocks?sector=Defense")
        assert res_def.status_code == 200
        defense_stocks = res_def.json()
        assert len(defense_stocks) == 5
        def_symbols = {d["symbol"] for d in defense_stocks}
        assert def_symbols == {"HAL", "BEL", "BDL", "MAZDOCK", "COCHINSHIP"}

        # Commodities
        res_com = await client.get(f"{settings.api_v1_prefix}/explore/stocks?sector=Commodities")
        assert res_com.status_code == 200
        com_stocks = res_com.json()
        assert len(com_stocks) == 2
        com_symbols = {c["symbol"] for c in com_stocks}
        assert com_symbols == {"GOLDBEES", "SILVERBEES"}

        # Metals
        res_met = await client.get(f"{settings.api_v1_prefix}/explore/stocks?sector=Metals")
        assert res_met.status_code == 200
        metals_stocks = res_met.json()
        assert len(metals_stocks) >= 5
        met_symbols = {m["symbol"] for m in metals_stocks}
        expected_metals = {"TATASTEEL", "HINDALCO", "JSWSTEEL", "VEDL", "JINDALSTEL"}
        assert expected_metals.issubset(met_symbols)


@pytest.mark.asyncio
async def test_explore_profiles_for_etf_and_defense(integration_app):
    """Verify 360-degree stock intelligence profiles for Gold ETF and HAL."""
    transport = ASGITransport(app=integration_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GOLDBEES Profile
        res_gold = await client.get(f"{settings.api_v1_prefix}/explore/profile/GOLDBEES")
        assert res_gold.status_code == 200
        gold_data = res_gold.json()
        assert gold_data["symbol"] == "GOLDBEES"
        assert gold_data["sector"] == "Commodities"
        assert "forecast" in gold_data
        assert "suitability" in gold_data
        assert "factors" in gold_data

        # HAL Profile
        res_hal = await client.get(f"{settings.api_v1_prefix}/explore/profile/HAL")
        assert res_hal.status_code == 200
        hal_data = res_hal.json()
        assert hal_data["symbol"] == "HAL"
        assert hal_data["sector"] == "Defense"
        assert hal_data["current_price"] > 0


def test_grow_service_bear_regime_allocates_defensive_commodity():
    """In High-Volatility Bear regimes, GrowService must include safe-haven ETFs with non-zero allocation."""
    market_svc = MarketDataService()
    regime_svc = MagicMock(spec=RegimeService)
    # Simulate High-Volatility Bear regime
    regime_svc.get_current_regime.return_value = CurrentRegimeResponse(
        regime=MarketRegimeType.HIGH_VOLATILITY_BEAR,
        regime_id=1,
        confidence=0.92,
        probabilities=RegimeProbabilities(bull=0.04, bear=0.92, sideways=0.04),
        metrics={},
        description="High Volatility Bear Regime",
        recommended_strategy="Capital Preservation",
        as_of_date="2026-09-03",
    )
    explore_svc = ExploreService(market_service=market_svc, regime_service=regime_svc)
    grow_svc = GrowService(
        market_service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
    )

    rec = grow_svc.recommend_basket(
        capital=50000.0,
        horizon="6M",
        risk_persona=RiskPersona.CONSERVATIVE,
    )

    # Check sum to 1.0
    total_w = sum(a.weight for a in rec.allocations)
    assert pytest.approx(total_w, rel=1e-3) == 1.0

    # Check that at least one commodity ETF is present and receives non-zero weight
    symbols = {a.symbol for a in rec.allocations}
    commodity_in_basket = symbols.intersection({"GOLDBEES", "SILVERBEES"})
    assert len(commodity_in_basket) > 0, f"Expected commodity ETF in bear regime basket, got symbols: {symbols}"

    for a in rec.allocations:
        if a.symbol in commodity_in_basket:
            assert a.weight >= 0.03, f"Defensive weight for {a.symbol} was {a.weight}, expected >= 0.03"
