# 03: Multi-Horizon Probabilistic Stock Growth Forecaster & Explore Tab

**What to build:** Generate multi-factor cross-sectional rankings and multi-horizon probabilistic return cones (10th, 50th, 90th percentiles for 1M, 3M, 6M, 12M horizons) for all NIFTY 50 equities, and render comprehensive Stock Intelligence Profiles on the `Explore` tab.

**Blocked by:** 01: Data Ingestion & NIFTY 50 Universe Service, 02: Unsupervised Market Regime Classifier & Regime Radar

**Status:** done

- [x] Generates technical, momentum, volatility, and regime-sensitivity factors for each NIFTY 50 stock.
- [x] Produces quantile return forecasts (Pessimistic 10th %, Base 50th %, Optimistic 90th %) across 1M, 3M, 6M, and 12M horizons ensuring quantile monotonicity ($Q_{10} \le Q_{50} \le Q_{90}$).
- [x] Computes a Regime Suitability Score for each stock indicating which market conditions favor it.
- [x] Renders the `Explore` tab with search, sector filtering, and detailed 360° Stock Intelligence Profile cards.
- [x] Passes automated tests validating forecast monotonicity and response schema.
