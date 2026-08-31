# 09: Ledoit-Wolf Covariance Shrinkage in HRP

**What to build:** Enhance the Hierarchical Risk Parity (HRP) optimization engine with Ledoit-Wolf covariance shrinkage (`sklearn.covariance.LedoitWolf`) to regularize empirical sample covariance matrices against noise over rolling market windows, improving weight stability.

**Blocked by:** 04: AI Portfolio Basket Recommendation Engine & Trust Card (`Grow` Tab)

**Status:** closed

- [x] Integrates Ledoit-Wolf analytical covariance shrinkage into the `HRPOptimizer` with automated fallback to empirical covariance.
- [x] Validates that tree clustering distance matrices are non-singular and well-conditioned across all market regimes.
- [x] Verifies that asset weights sum to 1.0 and respect risk-persona concentration caps.
- [x] Passes automated unit tests verifying shrinkage stability and weight sanity.
