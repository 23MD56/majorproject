# 04: AI Portfolio Basket Recommendation Engine & Trust Card (`Grow` Tab)

**What to build:** Build the 3-step capital/risk-to-basket generation engine using Regime-Aware Black-Litterman and Hierarchical Risk Parity (HRP) optimization, delivering curated NIFTY 50 baskets with 3-tier ₹ growth scenarios, the 4-pillar Explainable AI Trust Card, and Bank FD comparisons in the `Grow` tab.

**Blocked by:** 02: Unsupervised Market Regime Classifier & Regime Radar, 03: Multi-Horizon Probabilistic Stock Growth Forecaster & Explore Tab

**Status:** done

- [x] Implements 3-step wizard (Capital Amount, Time Horizon, Risk Persona: Conservative/Balanced/Aggressive).
- [x] Optimizes stock allocations using regime-aware risk parity enforcing risk-persona diversification constraints ($\sum w_i = 1.0$).
- [x] Calculates 3-tier expected rupee growth projections (Optimistic, Base, Pessimistic) and maximum stress drawdown guardrails.
- [x] Renders the 4-Pillar Explainable AI Trust Card (Regime Context, Backtested Hit Rate, Max Drawdown Guardrail, 0% Commission Disintermediation Savings).
- [x] Displays side-by-side growth comparison vs 7% Bank Fixed Deposit and NIFTY 50 benchmark.
- [x] Passes automated tests ensuring mathematical constraint adherence and proper risk-persona weighting.
