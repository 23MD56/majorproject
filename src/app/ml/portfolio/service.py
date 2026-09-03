"""GrowService domain orchestrator for AI Portfolio Basket recommendations."""

from datetime import datetime, timezone
from typing import Dict, List, Optional
import uuid
import pandas as pd

from app.core.models import (
    BasketAllocationItem,
    BasketRecommendationResponse,
    MarketRegimeType,
    MultiHorizonGrowthForecast,
    RiskPersona,
)
from app.data.service import MarketDataService
from app.ml.forecasting.factors import extract_stock_factors
from app.ml.forecasting.service import ExploreService
from app.ml.forecasting.suitability import compute_regime_suitability
from app.ml.portfolio.allocation import DiscreteAllocationEngine
from app.ml.portfolio.growth_calculator import (
    HORIZON_ATTR,
    HORIZON_DAYS,
    build_benchmark_comparisons,
    build_trust_card_pillars,
    calculate_basket_growth_projections,
)
from app.ml.portfolio.hrp import HRPOptimizer
from app.ml.regime.service import RegimeService
from app.universe import (
    _SYMBOL_MAP,
    get_esg_badge,
    get_esg_score_for_symbol,
    get_universe_metadata,
    normalize_symbol,
)


class GrowService:
    """Core domain service for AI Portfolio Basket Recommendation Engine and Trust Card."""

    def __init__(
        self,
        market_service: MarketDataService,
        regime_service: Optional[RegimeService] = None,
        explore_service: Optional[ExploreService] = None,
        hrp_optimizer: Optional[HRPOptimizer] = None,
        allocator: Optional[DiscreteAllocationEngine] = None,
    ):
        self.market_service = market_service
        self.regime_service = regime_service or RegimeService(market_service=market_service)
        self.explore_service = explore_service or ExploreService(
            market_service=market_service, regime_service=self.regime_service
        )
        self.hrp_optimizer = hrp_optimizer or HRPOptimizer()
        self.allocator = allocator or DiscreteAllocationEngine()

    def recommend_basket(
        self,
        capital: float = 50000.0,
        horizon: str = "6M",
        risk_persona: RiskPersona = RiskPersona.BALANCED,
    ) -> BasketRecommendationResponse:
        """Synthesize optimized AI Portfolio Basket, 3-tier growth scenarios, and Trust Card."""
        if capital < 1000.0 or capital > 10000000.0:
            raise ValueError(f"Capital ₹{capital:,.2f} is out of allowable range [₹1,000, ₹1,00,00,000]")

        if horizon not in HORIZON_DAYS:
            raise ValueError(f"Horizon '{horizon}' invalid. Must be one of: {list(HORIZON_DAYS.keys())}")

        # 1. Current Market Regime
        regime_info = self.regime_service.get_current_regime()
        active_regime = regime_info.regime
        regime_conf = regime_info.confidence

        # 2. Select Candidate Universe with Sector Diversification (Pre-rank by fast factors)
        universe_meta = get_universe_metadata(include_benchmarks=False)
        index_df = self.market_service.get_history("^NSEI")

        scored_candidates = []
        factors_map = {}

        for item in universe_meta:
            sym = item["symbol"]
            try:
                stock_df = self.market_service.get_history(sym)
                if stock_df.empty or len(stock_df) < 50:
                    continue

                factors = extract_stock_factors(stock_df, index_df)
                suit = compute_regime_suitability(factors, active_regime=active_regime)
                factors_map[sym] = factors

                # Composite score based on persona
                if risk_persona == RiskPersona.CONSERVATIVE:
                    vol = factors.get("realized_vol_30d", 0.20)
                    score = suit.score - (vol * 50.0)
                elif risk_persona == RiskPersona.AGGRESSIVE:
                    mom = factors.get("momentum_6m", 0.0)
                    score = suit.score + (mom * 50.0)
                else:  # BALANCED
                    score = suit.score

                scored_candidates.append({
                    "symbol": sym,
                    "name": item["name"],
                    "sector": item["sector"],
                    "score": score,
                    "suitability_score": suit.score,
                })
            except Exception:
                continue

        scored_candidates.sort(key=lambda x: x["score"], reverse=True)

        # Pick top 6–8 candidate stocks enforcing max 2 per sector
        selected_candidates = []
        sector_counts: Dict[str, int] = {}
        for cand in scored_candidates:
            sec = cand["sector"]
            if sector_counts.get(sec, 0) < 2:
                selected_candidates.append(cand)
                sector_counts[sec] = sector_counts.get(sec, 0) + 1
            if len(selected_candidates) >= 7:
                break

        if len(selected_candidates) < 4:
            # Fallback if sector limit was too strict
            selected_candidates = scored_candidates[:6]

        # Generate growth forecasts and fetch quotes ONLY for selected candidates
        stock_forecasts: Dict[str, MultiHorizonGrowthForecast] = {}
        for cand in selected_candidates:
            sym = cand["symbol"]
            quote = self.market_service.get_latest_quote(sym)
            fc = self.explore_service.get_growth_forecast(sym)
            cand["current_price"] = quote.current_price
            cand["forecast"] = fc
            stock_forecasts[sym] = fc

        selected_symbols = [c["symbol"] for c in selected_candidates]

        # 3. Build returns DataFrame for HRP optimization
        returns_dict = {}
        for sym in selected_symbols:
            df = self.market_service.get_history(sym)
            if "daily_return" in df.columns:
                ret_s = df["daily_return"].dropna()
            elif "return_pct" in df.columns:
                ret_s = df["return_pct"].dropna()
            else:
                ret_s = df["close"].pct_change().dropna()
            returns_dict[sym] = ret_s.iloc[-250:]

        returns_df = pd.DataFrame(returns_dict).dropna()

        # 4. HRP Optimization
        raw_weights = self.hrp_optimizer.optimize(
            returns_df=returns_df,
            risk_persona=risk_persona,
        )

        # Filter negligible weights & re-normalize
        filtered_weights = {k: v for k, v in raw_weights.items() if v >= 0.03}
        tot_w = sum(filtered_weights.values())
        norm_weights = {k: float(v / tot_w) for k, v in filtered_weights.items()}

        # 5. Discrete Allocation Engine (whole shares & cash buffer)
        prices_map = {c["symbol"]: c["current_price"] for c in selected_candidates if c["symbol"] in norm_weights}
        discrete_res = self.allocator.allocate(weights=norm_weights, prices=prices_map, capital=capital)

        attr_name = HORIZON_ATTR.get(horizon, "m6")
        allocations: List[BasketAllocationItem] = []
        for cand in selected_candidates:
            sym = cand["symbol"]
            if sym not in norm_weights:
                continue
            w = round(norm_weights[sym], 4)
            target_amt = round(w * capital, 2)
            price = cand["current_price"]
            shares = discrete_res.shares.get(sym, 0)
            allocated_amt = discrete_res.allocated_amounts.get(sym, 0.0)
            act_w = discrete_res.actual_weights.get(sym, 0.0)

            cone = getattr(cand["forecast"], attr_name)
            esg_meta = get_esg_score_for_symbol(sym)
            esg_comp = float(esg_meta["esg_composite"]) if esg_meta and "esg_composite" in esg_meta else 50.0

            allocations.append(
                BasketAllocationItem(
                    symbol=sym,
                    name=cand["name"],
                    sector=cand["sector"],
                    weight=w,
                    target_amount=target_amt,
                    shares_approx=shares,
                    shares=shares,
                    allocated_amount=allocated_amt,
                    actual_weight=act_w,
                    current_price=price,
                    growth_base_pct=cone.base_pct,
                    regime_suitability_score=cand["suitability_score"],
                    esg_composite=esg_comp,
                )
            )

        # Sort allocations by weight descending
        allocations.sort(key=lambda x: x.weight, reverse=True)

        # 6. Portfolio-Level Weighted ESG Conscience Metrics
        portfolio_esg_score = round(sum(a.weight * (a.esg_composite if a.esg_composite is not None else 50.0) for a in allocations), 2)
        portfolio_esg_badge = get_esg_badge(portfolio_esg_score)

        env_sum = sum(a.weight * float((get_esg_score_for_symbol(a.symbol) or {}).get("esg_environment", 50.0)) for a in allocations)
        soc_sum = sum(a.weight * float((get_esg_score_for_symbol(a.symbol) or {}).get("esg_social", 50.0)) for a in allocations)
        gov_sum = sum(a.weight * float((get_esg_score_for_symbol(a.symbol) or {}).get("esg_governance", 50.0)) for a in allocations)

        portfolio_esg_breakdown = {
            "esg_environment": round(env_sum, 2),
            "esg_social": round(soc_sum, 2),
            "esg_governance": round(gov_sum, 2),
        }

        # 7. Rupee Growth Projections (3 Scenarios)
        projections = calculate_basket_growth_projections(
            allocations=norm_weights,
            stock_forecasts=stock_forecasts,
            capital=capital,
            horizon=horizon,
            risk_persona=risk_persona,
            regime=active_regime,
        )

        # 8. 4-Pillar Explainable AI Trust Card
        trust_card = build_trust_card_pillars(
            regime=active_regime,
            regime_confidence=regime_conf,
            allocations=norm_weights,
            capital=capital,
            horizon=horizon,
            risk_persona=risk_persona,
            stress_drawdown_pct=projections.max_stress_drawdown_pct,
        )

        # 9. Benchmark Comparisons (Basket vs NIFTY 50 vs 7% Bank FD)
        # NIFTY baseline return estimate
        nifty_days = HORIZON_DAYS.get(horizon, 180)
        nifty_annual_baseline = 12.0 if active_regime == MarketRegimeType.LOW_VOLATILITY_BULL else 5.0
        nifty_horizon_return = round(nifty_annual_baseline * (nifty_days / 365.0), 2)

        benchmark_comparisons = build_benchmark_comparisons(
            basket_base_return_pct=projections.base.expected_return_pct,
            nifty_base_return_pct=nifty_horizon_return,
            capital=capital,
            horizon=horizon,
            stress_drawdown_pct=projections.max_stress_drawdown_pct,
        )

        basket_id = f"bsk_{uuid.uuid4().hex[:8]}"
        now_str = datetime.now(timezone.utc).isoformat()

        return BasketRecommendationResponse(
            basket_id=basket_id,
            capital=capital,
            horizon=horizon,
            risk_persona=risk_persona,
            active_regime=active_regime,
            created_at=now_str,
            allocations=allocations,
            growth_projections=projections,
            trust_card=trust_card,
            benchmark_comparisons=benchmark_comparisons,
            total_invested=discrete_res.total_invested,
            unallocated_cash=discrete_res.unallocated_cash,
            cash_buffer_pct=discrete_res.cash_buffer_pct,
            portfolio_esg_score=portfolio_esg_score,
            portfolio_esg_badge=portfolio_esg_badge,
            portfolio_esg_breakdown=portfolio_esg_breakdown,
        )
