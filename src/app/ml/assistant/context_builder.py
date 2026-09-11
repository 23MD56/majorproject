"""RAG Context Builder for NitiBot.

Aggregates:
1. Current market regime state and probabilities.
2. Active portfolio basket weights and stock names.
3. Growth projection quantiles for basket stocks.
4. Trust Card pillars (regime context, hit rate, max drawdown, fee savings).
5. Most recent backtest summary if available.
"""

from typing import Any, Dict, List, Optional
from app.core.models import (
    BasketRecommendationResponse,
    CurrentRegimeResponse,
    RAGContextPayload,
)
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService


class RAGContextBuilder:
    """Builds structured domain grounding context for NitiBot RAG queries."""

    def __init__(
        self,
        regime_service: Optional[RegimeService] = None,
        grow_service: Optional[GrowService] = None,
    ) -> None:
        self.regime_service = regime_service
        self.grow_service = grow_service

    def build_context(self, user_context: Optional[Dict[str, Any]] = None) -> RAGContextPayload:
        """Assemble a multi-pillar structured context payload."""
        user_ctx = user_context or {}
        sources: List[str] = []
        sections: List[str] = []

        # 1. Market Regime Pillar
        raw_regime_ctx = user_ctx.get("regime")
        regime_data: Optional[Dict[str, Any]] = raw_regime_ctx if isinstance(raw_regime_ctx, dict) else None
        if not regime_data and self.regime_service:
            try:
                regime_obj: CurrentRegimeResponse = self.regime_service.get_current_regime()
                regime_data = regime_obj.model_dump()
            except Exception:
                regime_data = None

        if regime_data:
            sources.append("Market Regime Engine (K-Means/GMM Unsupervised Clustering)")
            raw_regime = regime_data.get("regime", "Unknown Regime")
            regime_name = getattr(raw_regime, "value", str(raw_regime))
            confidence = regime_data.get("confidence", 0.0)
            probs = regime_data.get("probabilities", {})
            desc = regime_data.get("description", "")
            strategy = regime_data.get("recommended_strategy", "")
            as_of = regime_data.get("as_of_date", "")

            sections.append(
                f"### 1. Current Market Regime Context (As of {as_of}):\n"
                f"- **Active Regime**: {regime_name} (Confidence: {confidence * 100:.1f}%)\n"
                f"- **Regime Probabilities**: Bull: {probs.get('bull', 0.0)*100:.1f}%, "
                f"Bear: {probs.get('bear', 0.0)*100:.1f}%, "
                f"Sideways: {probs.get('sideways', 0.0)*100:.1f}%\n"
                f"- **Structural Condition**: {desc}\n"
                f"- **Adaptive Strategy Guidance**: {strategy}"
            )

        # 2. Portfolio Basket & Allocations Pillar
        raw_basket_ctx = user_ctx.get("basket")
        basket_data: Optional[Dict[str, Any]] = raw_basket_ctx if isinstance(raw_basket_ctx, dict) else None
        if not basket_data and self.grow_service:
            try:
                basket_obj: BasketRecommendationResponse = self.grow_service.recommend_basket()
                basket_data = basket_obj.model_dump()
            except Exception:
                basket_data = None

        if basket_data:
            sources.append("AI Portfolio Basket Engine (Hierarchical Risk Parity)")
            capital = basket_data.get("capital", 50000.0)
            horizon = basket_data.get("horizon", "6M")
            persona = basket_data.get("risk_persona", "Balanced")
            allocations = basket_data.get("allocations", [])
            total_invested = basket_data.get("total_invested", capital)
            unallocated_cash = basket_data.get("unallocated_cash", 0.0)

            alloc_lines = []
            for alloc in allocations:
                sym = alloc.get("symbol")
                name = alloc.get("name", sym)
                sector = alloc.get("sector", "")
                wt = alloc.get("actual_weight", alloc.get("weight", 0.0)) * 100
                shares = alloc.get("shares", 0)
                price = alloc.get("current_price", 0.0)
                growth = alloc.get("growth_base_pct", 0.0)
                esg_comp = alloc.get("esg_composite")
                esg_suffix = f", ESG: {esg_comp:.1f}/100" if esg_comp is not None else ""
                alloc_lines.append(
                    f"  - **{sym}** ({name} | {sector}): Weight: {wt:.1f}%, "
                    f"Shares: {shares}, Price: ₹{price:,.2f}, Base 6M Growth: {growth:+.1f}%{esg_suffix}"
                )

            port_esg = basket_data.get("portfolio_esg_score")
            port_badge = basket_data.get("portfolio_esg_badge", "")
            port_breakdown = basket_data.get("portfolio_esg_breakdown", {})
            esg_line = ""
            if port_esg:
                sources.append("ESG Conscience Score Layer (BRSR & CRISIL Disclosures)")
                env = port_breakdown.get("esg_environment", 0.0)
                soc = port_breakdown.get("esg_social", 0.0)
                gov = port_breakdown.get("esg_governance", 0.0)
                esg_line = (
                    f"\n- **Portfolio ESG Conscience**: Score: {port_esg:.1f}/100 ({port_badge}) "
                    f"[Environment: {env:.1f}, Social: {soc:.1f}, Governance: {gov:.1f}]"
                )

            alloc_summary = "\n".join(alloc_lines) if alloc_lines else "  - No active allocations."
            sections.append(
                f"### 2. Active Portfolio Basket Recommendation:\n"
                f"- **Target Capital**: ₹{capital:,.2f} | **Invested**: ₹{total_invested:,.2f} | **Cash Buffer**: ₹{unallocated_cash:,.2f}\n"
                f"- **Time Horizon**: {horizon} | **Risk Persona**: {persona}{esg_line}\n"
                f"- **Asset Allocations**:\n{alloc_summary}"
            )

            # Stock-level ESG lookup if user query or context specifies a ticker
            stock_data = user_ctx.get("stock")
            target_symbol = user_ctx.get("symbol") or (stock_data.get("symbol") if isinstance(stock_data, dict) else None)
            if target_symbol:
                from app.universe import get_esg_score_for_symbol
                esg_info = get_esg_score_for_symbol(target_symbol)
                if esg_info:
                    sources.append("ESG Conscience Score Layer (BRSR & CRISIL Disclosures)")
                    sections.append(
                        f"### Stock ESG Conscience Profile ({target_symbol}):\n"
                        f"- **Composite Score**: {esg_info.get('esg_composite', 50.0):.1f}/100 ({esg_info.get('badge', '')})\n"
                        f"- **Environmental Pillar**: {esg_info.get('esg_environment', 50.0):.1f}/100\n"
                        f"- **Social Pillar**: {esg_info.get('esg_social', 50.0):.1f}/100\n"
                        f"- **Governance Pillar**: {esg_info.get('esg_governance', 50.0):.1f}/100"
                    )

            # 3. Growth Projections
            projections = basket_data.get("growth_projections", {})
            if projections:
                sources.append("Probabilistic Growth Forecaster (LightGBM Quantile Cones)")
                opt = projections.get("optimistic", {})
                base = projections.get("base", {})
                pess = projections.get("pessimistic", {})
                max_dd = projections.get("max_stress_drawdown_pct", 0.0)
                max_dd_inr = projections.get("max_stress_drawdown_rupees", 0.0)

                sections.append(
                    f"### 3. Portfolio Growth Projection Quantiles ({horizon}):\n"
                    f"- **Optimistic (90th)**: Expected Return: {opt.get('expected_return_pct', 0.0):+.1f}%, "
                    f"Projected Value: ₹{opt.get('projected_value', 0.0):,.2f} (Gain: ₹{opt.get('projected_gain_rupees', 0.0):+,.2f})\n"
                    f"- **Base Case (50th)**: Expected Return: {base.get('expected_return_pct', 0.0):+.1f}%, "
                    f"Projected Value: ₹{base.get('projected_value', 0.0):,.2f} (Gain: ₹{base.get('projected_gain_rupees', 0.0):+,.2f})\n"
                    f"- **Pessimistic (10th)**: Expected Return: {pess.get('expected_return_pct', 0.0):+.1f}%, "
                    f"Projected Value: ₹{pess.get('projected_value', 0.0):,.2f} (Gain: ₹{pess.get('projected_gain_rupees', 0.0):+,.2f})\n"
                    f"- **Stress Drawdown Guardrail**: -{max_dd:.1f}% (-₹{max_dd_inr:,.2f})"
                )

            # 4. Trust Card Pillars
            trust_card = basket_data.get("trust_card", {})
            if trust_card:
                sources.append("QuantNiti 4-Pillar Trust Card")
                reg_pillar = trust_card.get("regime_context", {})
                rel_pillar = trust_card.get("model_reliability", {})
                dd_pillar = trust_card.get("drawdown_guardrail", {})
                sav_pillar = trust_card.get("disintermediation_savings", {})

                sections.append(
                    f"### 4. Explainable AI Trust Card Verification:\n"
                    f"- **Regime Pillar**: {reg_pillar.get('summary', 'Optimized for current market regime.')}\n"
                    f"- **Reliability Pillar**: Hit Rate: {rel_pillar.get('backtested_hit_rate_pct', 0.0):.1f}% over {rel_pillar.get('lookback_years', 5)} years. {rel_pillar.get('summary', '')}\n"
                    f"- **Drawdown Guardrail Pillar**: Max Drawdown Limit: {dd_pillar.get('max_drawdown_limit_pct', 0.0):.1f}%. {dd_pillar.get('summary', '')}\n"
                    f"- **Fee Savings Pillar**: Traditional Fee: {sav_pillar.get('traditional_fee_pct', 2.0)}% vs QuantNiti: 0%. "
                    f"Estimated Annual Savings: ₹{sav_pillar.get('estimated_annual_savings_rupees', 0.0):,.2f}."
                )

        # 5. Backtest Summary Pillar (if available)
        raw_backtest_ctx = user_ctx.get("backtest")
        backtest_data: Optional[Dict[str, Any]] = raw_backtest_ctx if isinstance(raw_backtest_ctx, dict) else None
        if backtest_data:
            sources.append("Quant Lab Vectorized Backtesting Engine")
            symbol = backtest_data.get("symbol", "^NSEI")
            strat = backtest_data.get("strategy", "Technical Strategy")
            metrics = backtest_data.get("metrics", {})

            sections.append(
                f"### 5. Quant Lab Backtest Performance ({symbol} | {strat}):\n"
                f"- **Total Return**: {metrics.get('total_return_pct', 0.0):+.1f}% vs Benchmark: {metrics.get('benchmark_total_return_pct', 0.0):+.1f}%\n"
                f"- **CAGR**: {metrics.get('cagr', 0.0):.1f}% | **Sharpe Ratio**: {metrics.get('sharpe_ratio', 0.0):.2f} | **Sortino**: {metrics.get('sortino_ratio', 0.0):.2f}\n"
                f"- **Max Drawdown**: {metrics.get('max_drawdown_pct', 0.0):.1f}% vs Benchmark DD: {metrics.get('benchmark_max_drawdown_pct', 0.0):.1f}%\n"
                f"- **Win Rate**: {metrics.get('win_rate_pct', 0.0):.1f}% ({metrics.get('winning_trades', 0)} wins / {metrics.get('total_trades', 0)} trades)\n"
                f"- **Alpha**: {metrics.get('alpha', 0.0):+.2f}% | **Beta**: {metrics.get('beta', 1.0):.2f}"
            )

        # 6. Financial Literacy Microlearning Grounding
        matched_cards = self._find_relevant_literacy_cards(user_ctx)
        if matched_cards:
            sources.append("Financial Literacy Knowledge Base")
            card_lines = []
            for card in matched_cards:
                cat_val = card.category.value if hasattr(card.category, "value") else str(card.category)
                card_lines.append(
                    f"#### Concept: {card.title} (Category: {cat_val})\n"
                    f"- **Explanation**: {card.explanation}\n"
                    f"- **Relatable Analogy**: {card.analogy}"
                )
            sections.append("### 6. Relevant Financial Literacy Microlearning Concepts:\n" + "\n\n".join(card_lines))

        # Ensure deduplicated source list
        unique_sources: List[str] = list(dict.fromkeys(sources))
        grounding_text = "\n\n".join(sections) if sections else "No active QuantNiti data context available."

        return RAGContextPayload(
            grounding_text=grounding_text,
            sources=unique_sources,
            metadata={"sections_count": len(sections)},
        )

    def _find_relevant_literacy_cards(self, user_ctx: Dict[str, Any]):
        """Find literacy cards relevant to user context or query."""
        try:
            from app.api.routes.literacy import _get_literacy_data
            all_cards = _get_literacy_data()
        except Exception:
            return []

        matched = []
        concept_key = user_ctx.get("concept_key")
        if concept_key:
            for card in all_cards:
                if card.key == concept_key:
                    matched.append(card)
                    return matched

        query = str(user_ctx.get("query") or user_ctx.get("message") or "").lower()
        if not query:
            return []

        import re
        tokens = set(re.findall(r"\w+", query))
        stopwords = {"the", "a", "an", "and", "or", "is", "in", "to", "for", "with", "what", "how", "can", "you", "explain", "like", "of", "about", "there", "just", "checking", "hello", "time"}
        tokens = {t for t in tokens if t not in stopwords and len(t) > 2}
        if not tokens:
            return []

        scored_cards = []
        for card in all_cards:
            score = 0
            card_key_parts = set(card.key.split("_"))
            card_title_tokens = set(re.findall(r"\w+", card.title.lower()))
            analogy_tokens = set(re.findall(r"\w+", card.analogy.lower()))
            explanation_tokens = set(re.findall(r"\w+", card.explanation.lower()))

            # Key matches have highest weight
            score += len(tokens & card_key_parts) * 5
            # Title matches have high weight
            score += len(tokens & card_title_tokens) * 3
            # Analogy matches
            score += len(tokens & analogy_tokens) * 2
            # Explanation matches
            score += len(tokens & explanation_tokens) * 1

            if score > 0:
                scored_cards.append((score, card))

        scored_cards.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored_cards[:2]]
