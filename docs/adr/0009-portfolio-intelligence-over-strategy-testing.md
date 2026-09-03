# Portfolio Intelligence Platform over Strategy Testing Platform

QuantNiti pivots from a dual-identity "strategy testing + portfolio recommendation" platform to a portfolio-intelligence-first product. The Quant Lab (regime radar + strategy backtesting studio) is demoted from a primary navigation tab to a subordinate "Advanced Analysis" toggle within the Explore tab. The regime radar surfaces on the Home tab as a market pulse indicator.

## Context

The project review panel feedback (September 2026) explicitly requested beginner-friendliness and a focus on portfolio growth intelligence over quantitative strategy evaluation. The original architecture gave equal weight to the Quant Lab (technical strategy backtesting) and the Grow tab (portfolio recommendation), implying a dual audience of retail investors AND active traders. The panel's direction — "very beginner friendly," "educational platform," "portfolio intelligence" — makes the trader-facing strategy backtester a secondary concern.

## Considered Options

1. **Kill Quant Lab entirely**: Remove all backtesting UI and code. Rejected because the backtesting engine validates the ML pipeline's accuracy during academic defense — evaluators will ask "how do you know your model works?"
2. **Keep Quant Lab as a primary tab**: Rejected because it contradicts the beginner-first pivot and splits the product's identity between two audiences.
3. **Demote Quant Lab to an advanced toggle (chosen)**: The regime radar moves to the Home tab where it serves portfolio intelligence directly. The strategy backtester becomes a collapsible section inside the Explore tab, accessible to evaluators and power users without cluttering the default experience.

## Consequences

- Tab navigation restructures from `[Grow] [Explore] [Quant Lab] [Portfolio]` to `[Home] [Explore] [Grow] [Portfolio]`.
- Home tab becomes the primary landing with adaptive content (onboarding vs portfolio snapshot).
- In-app copy shifts from quantitative jargon to plain-language portfolio intelligence (dual identity: quant in docs, human in UI).
- The backtesting engine code is preserved and testable; only the UI routing changes.
