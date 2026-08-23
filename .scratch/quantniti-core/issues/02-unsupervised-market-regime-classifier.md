# 02: Unsupervised Market Regime Classifier & Regime Radar

**What to build:** Train and serve an unsupervised machine learning model (Gaussian HMM / GMM) that classifies the Indian equity market into three distinct regimes (Low-Volatility Bull, High-Volatility Bear, Sideways Consolidation) based on rolling returns and volatility, rendered on an interactive Market Regime Radar.

**Blocked by:** 01: Data Ingestion & NIFTY 50 Universe Service

**Status:** done

- [x] Calculates rolling log returns, realized volatility, and India VIX features on index data.
- [x] Classifies current market regime into 3 macro states (Bull, Bear, Sideways) with probability distribution summing to 1.0.
- [x] Provides an API endpoint returning current regime state, state probabilities, and historical regime transition dates.
- [x] Displays the interactive Regime Radar and regime probability badge in the UI.
- [x] Passes automated tests verifying cluster separation, non-zero probability distributions, and deterministic state labeling.
