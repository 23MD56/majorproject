"""ExploreService facade providing 360-degree stock intelligence profiles and forecasts."""

from datetime import datetime, timezone
from typing import List, Optional
import pandas as pd

from app.core.models import (
    BenchmarkComparison,
    ExploreStockSummary,
    HorizonForecastCone,
    MultiHorizonGrowthForecast,
    RegimeSuitability,
    StockFactorSnapshot,
    StockIntelligenceProfile,
    StockPeerSummary,
)
from app.data.service import MarketDataService
from app.ml.forecasting.factors import extract_stock_factors
from app.ml.forecasting.forecaster import MultiHorizonForecaster
from app.ml.forecasting.suitability import compute_regime_suitability
from app.ml.regime.service import RegimeService
from app.universe import (
    get_sector_for_symbol,
    get_universe_metadata,
    get_universe_symbols,
    is_valid_symbol,
    normalize_symbol,
    _SYMBOL_MAP,
)


class ExploreService:
    """Core domain service for Stock Intelligence Profiles and Explore Tab."""

    def __init__(
        self,
        market_service: MarketDataService,
        regime_service: Optional[RegimeService] = None,
        forecaster: Optional[MultiHorizonForecaster] = None,
    ):
        self.market_service = market_service
        self.regime_service = regime_service or RegimeService(market_service=market_service)
        self.forecaster = forecaster or MultiHorizonForecaster()

    def get_growth_forecast(self, symbol: str) -> MultiHorizonGrowthForecast:
        """Generate multi-horizon probabilistic return cones for a stock."""
        canonical = normalize_symbol(symbol)
        if not is_valid_symbol(canonical):
            raise ValueError(f"Symbol '{symbol}' not found in NIFTY 50 universe")

        stock_df = self.market_service.get_history(canonical)
        index_df = self.market_service.get_history("^NSEI")
        quote = self.market_service.get_latest_quote(canonical)

        return self.forecaster.predict_growth_cones(
            stock_df=stock_df,
            index_df=index_df,
            current_price=quote.current_price,
            symbol=canonical,
        )

    def get_stock_profile(self, symbol: str) -> StockIntelligenceProfile:
        """Synthesize complete 360-degree Stock Intelligence Profile."""
        canonical = normalize_symbol(symbol)
        if not is_valid_symbol(canonical):
            raise ValueError(f"Symbol '{symbol}' not found in NIFTY 50 universe")

        meta = _SYMBOL_MAP.get(canonical, {"name": canonical, "sector": "Unknown"})
        stock_df = self.market_service.get_history(canonical)
        index_df = self.market_service.get_history("^NSEI")
        quote = self.market_service.get_latest_quote(canonical)

        # 1. Multi-horizon growth forecast
        forecast = self.forecaster.predict_growth_cones(
            stock_df=stock_df,
            index_df=index_df,
            current_price=quote.current_price,
            symbol=canonical,
        )

        # 2. Extract factors
        factors_dict = extract_stock_factors(stock_df, index_df)
        factor_snapshot = StockFactorSnapshot(
            rsi_14=factors_dict.get("rsi_14", 50.0),
            macd=factors_dict.get("macd", 0.0),
            macd_hist=factors_dict.get("macd_hist", 0.0),
            bollinger_pct_b=factors_dict.get("bollinger_pct_b", 0.5),
            ema_20_50_spread=factors_dict.get("ema_20_50_spread", 0.0),
            ema_50_200_spread=factors_dict.get("ema_50_200_spread", 0.0),
            momentum_1m=factors_dict.get("momentum_1m", 0.0),
            momentum_3m=factors_dict.get("momentum_3m", 0.0),
            momentum_6m=factors_dict.get("momentum_6m", 0.0),
            momentum_12m=factors_dict.get("momentum_12m", 0.0),
            realized_vol_30d=factors_dict.get("realized_vol_30d", 0.20),
            realized_vol_90d=factors_dict.get("realized_vol_90d", 0.20),
            max_drawdown_1y=factors_dict.get("max_drawdown_1y", -0.10),
            beta=factors_dict.get("beta", 1.0),
            alpha_annualized=factors_dict.get("alpha_annualized", 0.0),
            market_correlation=factors_dict.get("market_correlation", 0.65),
        )

        # 3. Regime suitability
        current_regime_info = self.regime_service.get_current_regime()
        suitability = compute_regime_suitability(factors_dict, active_regime=current_regime_info.regime)

        # 4. Benchmark comparison (3-year performance vs NIFTY 50)
        stock_3y_ret = float(stock_df["close"].pct_change(periods=min(756, len(stock_df) - 1)).iloc[-1]) if len(stock_df) > 20 else 0.15
        bench_3y_ret = float(index_df["close"].pct_change(periods=min(756, len(index_df) - 1)).iloc[-1]) if len(index_df) > 20 else 0.12

        bench_comp = BenchmarkComparison(
            stock_3y_return=round(stock_3y_ret, 4),
            benchmark_3y_return=round(bench_3y_ret, 4),
            alpha=factor_snapshot.alpha_annualized,
            beta=factor_snapshot.beta,
            correlation=factor_snapshot.market_correlation,
        )

        # 5. Sector peers summary
        sector = meta.get("sector", "Unknown")
        all_meta = get_universe_metadata(include_benchmarks=False)
        peer_meta = [m for m in all_meta if m["sector"] == sector and m["symbol"] != canonical][:4]

        peers: List[StockPeerSummary] = []
        for p in peer_meta:
            try:
                p_quote = self.market_service.get_latest_quote(p["symbol"])
                p_hist = self.market_service.get_history(p["symbol"])
                p_fc = self.forecaster.predict_growth_cones(p_hist, index_df, current_price=p_quote.current_price, symbol=p["symbol"])
                peers.append(
                    StockPeerSummary(
                        symbol=p["symbol"],
                        name=p["name"],
                        sector=p["sector"],
                        current_price=p_quote.current_price,
                        day_change_pct=p_quote.day_change_pct,
                        base_growth_6m=p_fc.m6.base_pct,
                    )
                )
            except Exception:
                pass

        latest_date = (
            stock_df.index[-1].strftime("%Y-%m-%d")
            if hasattr(stock_df.index[-1], "strftime")
            else str(stock_df.index[-1])[:10]
        )

        return StockIntelligenceProfile(
            symbol=canonical,
            name=meta.get("name", canonical),
            sector=sector,
            current_price=quote.current_price,
            day_change=quote.day_change,
            day_change_pct=quote.day_change_pct,
            day_high=quote.day_high,
            day_low=quote.day_low,
            week_52_high=quote.week_52_high,
            week_52_low=quote.week_52_low,
            volume=quote.volume,
            as_of_date=latest_date,
            forecast=forecast,
            suitability=suitability,
            factors=factor_snapshot,
            benchmark_comparison=bench_comp,
            peers=peers,
        )

    def list_explore_stocks(
        self,
        sector: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ExploreStockSummary]:
        """List all NIFTY 50 stocks with summary growth projections and regime suitability."""
        all_meta = get_universe_metadata(include_benchmarks=False)
        index_df = self.market_service.get_history("^NSEI")
        current_regime = self.regime_service.get_current_regime().regime

        results: List[ExploreStockSummary] = []

        for item in all_meta:
            sym = item["symbol"]
            name = item["name"]
            st_sector = item["sector"]

            # Filter by sector
            if sector and st_sector.lower() != sector.strip().lower():
                continue

            # Filter by search
            if search:
                q = search.strip().lower()
                if q not in sym.lower() and q not in name.lower() and q not in st_sector.lower():
                    continue

            try:
                quote = self.market_service.get_latest_quote(sym)
                stock_df = self.market_service.get_history(sym)
                factors = extract_stock_factors(stock_df, index_df)
                suit = compute_regime_suitability(factors, active_regime=current_regime)
                forecast = self.forecaster.predict_growth_cones(stock_df, index_df, current_price=quote.current_price, symbol=sym)

                results.append(
                    ExploreStockSummary(
                        symbol=sym,
                        name=name,
                        sector=st_sector,
                        current_price=quote.current_price,
                        day_change=quote.day_change,
                        day_change_pct=quote.day_change_pct,
                        growth_6m_base_pct=forecast.m6.base_pct,
                        growth_6m_optimistic_pct=forecast.m6.optimistic_pct,
                        growth_6m_pessimistic_pct=forecast.m6.pessimistic_pct,
                        regime_suitability_score=suit.score,
                        regime_badge=suit.badge,
                        volume=quote.volume,
                    )
                )
            except Exception:
                pass

        return results
