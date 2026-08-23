# 06: Virtual Paper Portfolio Simulator & Regime Rebalance Diff Engine (`Portfolio` Tab)

**What to build:** Provide a simulated investment tracking environment where users can activate recommended baskets, track live mark-to-market valuations and benchmark alpha, receive interactive before/after diff alerts when market regimes transition, and export 1-click broker order sheets.

**Blocked by:** 04: AI Portfolio Basket Recommendation Engine & Trust Card (`Grow` Tab)

**Status:** done

- [x] Allows activating any AI basket into a simulated Virtual Paper Portfolio with initial capital.
- [x] Calculates daily mark-to-market portfolio value, unrealized P&L, and benchmark outperformance vs NIFTY 50 and Bank FDs.
- [x] Triggers a proactive Regime-Shift Rebalance alert when market regime changes, showing an interactive visual diff between old and new allocations.
- [x] Provides an "Apply Rebalance" button that updates virtual holdings to the new regime-optimized distribution.
- [x] Generates a 1-Click Broker Order Sheet with exact share counts and prices ready to copy for Zerodha or Groww.
- [x] Passes automated tests verifying P&L calculations and rebalance diff transitions.
