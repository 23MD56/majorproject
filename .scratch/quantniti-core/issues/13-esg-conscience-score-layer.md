# 13: ESG Conscience Score Layer

**What to build:** Add an Environmental, Social, and Governance (ESG) scoring dimension to every stock in the NIFTY 50 universe, visible on Stock Intelligence Profiles and aggregated at the portfolio level on Grow tab basket results. Introduce an "ESG-Conscious" risk persona that tilts HRP portfolio weights toward high-ESG-scoring companies, enabling users to make socially responsible investment decisions backed by SEBI-mandated BRSR public data. All ESG data is a curated static dataset — no external API calls at runtime.

**Blocked by:** 01: Data Ingestion & NIFTY 50 Market Data Service, 04: AI Portfolio Basket Engine & Trust Card

**Status:** ready-for-agent

- [ ] Creates a curated ESG score dataset covering all 50 NIFTY tickers, with fields: `esg_composite` (0–100), `esg_environment` (0–100), `esg_social` (0–100), `esg_governance` (0–100), sourced from publicly available BRSR disclosures, CRISIL ESG ratings, and NSE Sustainability index methodology.
- [ ] Extends the stock universe data model to include the four ESG fields per ticker, loaded at service initialization alongside existing price data.
- [ ] Adds `GET /api/v1/explore/{ticker}/esg` endpoint returning the ESG score triplet and composite for a given ticker.
- [ ] Renders ESG Conscience Score badge (🟢 ≥ 70, 🟡 40–69, 🔴 < 40) on each Stock Intelligence Profile card in the Explore tab, with a breakdown tooltip showing Environment / Social / Governance sub-scores.
- [ ] Computes and displays a portfolio-level weighted ESG composite score on Grow tab basket results: $\text{ESG}_{\text{portfolio}} = \sum w_i \cdot \text{ESG}_i$.
- [ ] Adds "ESG-Conscious" as a 4th risk persona option (alongside Conservative, Balanced, Aggressive) in the Grow tab wizard. When selected, applies an additive weight bias toward stocks with `esg_composite ≥ 70` before HRP bisection, while maintaining return expectations and weight-sum constraint ($\sum w_i = 1.0$).
- [ ] NitiBot RAG context includes ESG scores when answering ESG-related questions.
- [ ] Passes automated unit tests: ESG data loads for all 50 tickers, portfolio-level weighted ESG aggregation is mathematically correct, ESG-Conscious persona produces weights that demonstrably favor high-ESG stocks compared to the same capital/horizon with the Balanced persona.
