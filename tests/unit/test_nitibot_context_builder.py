"""Unit tests for NitiBot RAGContextBuilder."""

import pytest
from unittest.mock import MagicMock

from app.core.models import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatStatusResponse,
    CurrentRegimeResponse,
    MarketRegimeType,
    RegimeProbabilities,
    BasketRecommendationResponse,
    BasketGrowthProjections,
    RupeeGrowthTier,
    TrustCardPillars,
    TrustCardPillarRegime,
    TrustCardPillarReliability,
    TrustCardPillarDrawdown,
    TrustCardPillarSavings,
    BasketAllocationItem,
    RiskPersona,
    BacktestResponse,
    BacktestMetrics,
    StrategyType,
)
from app.ml.assistant.context_builder import RAGContextBuilder


def create_sample_regime() -> CurrentRegimeResponse:
    return CurrentRegimeResponse(
        regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        regime_id=0,
        probabilities=RegimeProbabilities(bull=0.75, bear=0.10, sideways=0.15),
        confidence=0.85,
        metrics={"realized_vol_30d": 12.5, "trend_slope": 0.04},
        description="Strong bullish momentum with low volatility.",
        recommended_strategy="Momentum and Growth Tilt",
        as_of_date="2026-08-24",
    )


def create_sample_basket() -> BasketRecommendationResponse:
    return BasketRecommendationResponse(
        basket_id="basket_test_123",
        capital=50000.0,
        horizon="6M",
        risk_persona=RiskPersona.BALANCED,
        active_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        created_at="2026-08-24T10:00:00",
        allocations=[
            BasketAllocationItem(
                symbol="RELIANCE",
                name="Reliance Industries Ltd.",
                sector="Energy",
                weight=0.25,
                target_amount=12500.0,
                shares=4,
                allocated_amount=12000.0,
                actual_weight=0.24,
                current_price=3000.0,
                growth_base_pct=14.2,
                regime_suitability_score=88.5,
            ),
            BasketAllocationItem(
                symbol="TCS",
                name="Tata Consultancy Services Ltd.",
                sector="Information Technology",
                weight=0.25,
                target_amount=12500.0,
                shares=3,
                allocated_amount=12000.0,
                actual_weight=0.24,
                current_price=4000.0,
                growth_base_pct=12.1,
                regime_suitability_score=82.0,
            ),
        ],
        growth_projections=BasketGrowthProjections(
            capital=50000.0,
            horizon="6M",
            optimistic=RupeeGrowthTier(
                tier="Optimistic (90th)",
                expected_return_pct=18.5,
                projected_value=59250.0,
                projected_gain_rupees=9250.0,
            ),
            base=RupeeGrowthTier(
                tier="Base Case (50th)",
                expected_return_pct=11.2,
                projected_value=55600.0,
                projected_gain_rupees=5600.0,
            ),
            pessimistic=RupeeGrowthTier(
                tier="Pessimistic (10th)",
                expected_return_pct=-3.5,
                projected_value=48250.0,
                projected_gain_rupees=-1750.0,
            ),
            max_stress_drawdown_pct=8.4,
            max_stress_drawdown_rupees=4200.0,
        ),
        trust_card=TrustCardPillars(
            regime_context=TrustCardPillarRegime(
                regime=MarketRegimeType.LOW_VOLATILITY_BULL,
                confidence=0.85,
                summary="Optimized for Low-Volatility Bull market conditions.",
            ),
            model_reliability=TrustCardPillarReliability(
                backtested_hit_rate_pct=76.4,
                lookback_years=5,
                summary="Historical 76.4% directional hit rate.",
            ),
            drawdown_guardrail=TrustCardPillarDrawdown(
                max_drawdown_limit_pct=8.4,
                stress_loss_rupees=4200.0,
                summary="Stress drawdown capped at 8.4% (₹4,200).",
            ),
            disintermediation_savings=TrustCardPillarSavings(
                commission_fee_pct=0.0,
                traditional_fee_pct=2.0,
                estimated_annual_savings_rupees=1000.0,
                summary="Estimated savings of ₹1,000 annually over 2% fee wealth managers.",
            ),
        ),
        benchmark_comparisons=[],
        total_invested=48000.0,
        unallocated_cash=2000.0,
        cash_buffer_pct=4.0,
    )


def create_sample_backtest() -> BacktestResponse:
    return BacktestResponse(
        backtest_id="bt_123",
        symbol="^NSEI",
        name="NIFTY 50 Index",
        strategy=StrategyType.MA_CROSSOVER,
        start_date="2020-01-01",
        end_date="2025-01-01",
        initial_capital=100000.0,
        metrics=BacktestMetrics(
            initial_capital=100000.0,
            final_equity=185000.0,
            total_return_pct=85.0,
            cagr=13.1,
            annualized_volatility=14.2,
            sharpe_ratio=1.45,
            sortino_ratio=1.92,
            max_drawdown_pct=15.3,
            calmar_ratio=0.85,
            win_rate_pct=58.2,
            profit_factor=1.8,
            total_trades=24,
            winning_trades=14,
            losing_trades=10,
            avg_trade_return_pct=3.5,
            benchmark_total_return_pct=65.0,
            benchmark_cagr=10.5,
            benchmark_max_drawdown_pct=28.0,
            alpha=2.6,
            beta=0.85,
        ),
        equity_curve=[],
        trades=[],
        regime_breakdown=[],
        parameters_used={"fast_period": 20, "slow_period": 50},
    )


def test_rag_context_builder_builds_complete_grounding():
    regime_service = MagicMock()
    regime_service.get_current_regime.return_value = create_sample_regime()

    grow_service = MagicMock()
    grow_service.recommend_basket.return_value = create_sample_basket()

    builder = RAGContextBuilder(
        regime_service=regime_service,
        grow_service=grow_service,
    )

    context_payload = builder.build_context(
        user_context={
            "basket": create_sample_basket().model_dump(),
            "backtest": create_sample_backtest().model_dump(),
        }
    )

    assert context_payload is not None
    assert "Low-Volatility Bull" in context_payload.grounding_text
    assert "RELIANCE" in context_payload.grounding_text
    assert "TCS" in context_payload.grounding_text
    assert "Optimistic (90th)" in context_payload.grounding_text
    assert "76.4%" in context_payload.grounding_text
    assert "₹1,000" in context_payload.grounding_text
    assert "MA_CROSSOVER" in context_payload.grounding_text or "Moving Average Crossover" in context_payload.grounding_text
    assert len(context_payload.sources) >= 4
    assert any("Regime" in s for s in context_payload.sources)
    assert any("Basket" in s or "Portfolio" in s for s in context_payload.sources)
    assert any("Trust Card" in s for s in context_payload.sources)


def test_rag_context_builder_fallback_defaults():
    regime_service = MagicMock()
    regime_service.get_current_regime.return_value = create_sample_regime()

    grow_service = MagicMock()
    grow_service.recommend_basket.return_value = create_sample_basket()

    builder = RAGContextBuilder(
        regime_service=regime_service,
        grow_service=grow_service,
    )

    # Empty user context -> relies on service defaults
    context_payload = builder.build_context(user_context=None)
    assert "Low-Volatility Bull" in context_payload.grounding_text
    assert "RELIANCE" in context_payload.grounding_text
    assert len(context_payload.sources) >= 3


def test_rag_context_builder_esg_enrichment():
    regime_service = MagicMock()
    regime_service.get_current_regime.return_value = create_sample_regime()

    basket = create_sample_basket()
    basket.portfolio_esg_score = 78.5
    basket.portfolio_esg_badge = "🟢 High ESG"
    basket.portfolio_esg_breakdown = {
        "esg_environment": 75.0,
        "esg_social": 80.0,
        "esg_governance": 81.0,
    }
    basket.allocations[0].esg_composite = 86.0

    grow_service = MagicMock()
    grow_service.recommend_basket.return_value = basket

    builder = RAGContextBuilder(
        regime_service=regime_service,
        grow_service=grow_service,
    )

    context_payload = builder.build_context(
        user_context={
            "basket": basket.model_dump(),
            "symbol": "TCS",
            "query": "Tell me about TCS ESG conscience score",
        }
    )

    assert "Portfolio ESG Conscience" in context_payload.grounding_text
    assert "78.5/100" in context_payload.grounding_text
    assert "🟢 High ESG" in context_payload.grounding_text
    assert "Stock ESG Conscience Profile (TCS)" in context_payload.grounding_text
    assert any("ESG Conscience" in s for s in context_payload.sources)
