import pytest
from app.core.models import ExploreStockSummary, MultiHorizonGrowthForecast, StockIntelligenceProfile
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.ml.forecasting.service import ExploreService
from app.ml.regime.service import RegimeService


@pytest.fixture
def explore_service(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    market_service = MarketDataService(provider=provider, cache=cache)
    regime_service = RegimeService(market_service=market_service)
    return ExploreService(
        market_service=market_service,
        regime_service=regime_service,
    )


def test_get_stock_profile(explore_service):
    profile = explore_service.get_stock_profile("INFY")
    assert isinstance(profile, StockIntelligenceProfile)
    assert profile.symbol == "INFY"
    assert profile.name == "Infosys Ltd."
    assert profile.sector == "Information Technology"
    assert profile.current_price > 0
    # Forecast cones check
    assert profile.forecast.m6.base_pct is not None
    assert profile.forecast.m6.pessimistic_pct <= profile.forecast.m6.base_pct <= profile.forecast.m6.optimistic_pct
    # Regime suitability check
    assert profile.suitability.score >= 0.0
    assert len(profile.suitability.badge) > 0
    # Factors snapshot check
    assert profile.factors.beta > 0
    assert profile.factors.rsi_14 > 0
    # Benchmark comparison check
    assert profile.benchmark_comparison.correlation is not None


def test_get_growth_forecast(explore_service):
    forecast = explore_service.get_growth_forecast("RELIANCE")
    assert isinstance(forecast, MultiHorizonGrowthForecast)
    assert forecast.symbol == "RELIANCE"
    assert forecast.m1.pessimistic_pct <= forecast.m1.base_pct <= forecast.m1.optimistic_pct
    assert forecast.m12.pessimistic_pct <= forecast.m12.base_pct <= forecast.m12.optimistic_pct


def test_list_explore_stocks_and_filter(explore_service):
    # Test full list
    stocks = explore_service.list_explore_stocks()
    assert len(stocks) == 50
    assert all(isinstance(s, ExploreStockSummary) for s in stocks)
    assert any(s.symbol == "TCS" for s in stocks)

    # Test sector filtering
    it_stocks = explore_service.list_explore_stocks(sector="Information Technology")
    assert len(it_stocks) >= 4
    assert all(s.sector == "Information Technology" for s in it_stocks)

    # Test search query
    searched = explore_service.list_explore_stocks(search="Tata")
    assert len(searched) >= 2
    assert all("tata" in s.name.lower() or "tata" in s.symbol.lower() for s in searched)
