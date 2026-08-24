# 08: Discrete Integer Allocation & Cash Buffer Engine

**What to build:** Implement an integer programming discrete allocation algorithm (inspired by PyPortfolioOpt) that converts continuous theoretical portfolio weights into exact whole-share quantities ($n_i \in \mathbb{Z}_{\ge 0}$) given a target capital amount, calculating and reporting the exact remaining unallocated cash buffer.

**Blocked by:** 04: AI Portfolio Basket Recommendation Engine & Trust Card (`Grow` Tab), 06: Virtual Paper Portfolio Simulator & Regime Rebalance Diff Engine (`Portfolio` Tab)

**Status:** done

- [x] Implements discrete integer share calculation ensuring no fractional shares and total spend does not exceed available capital.
- [x] Tracks exact unallocated cash buffer (e.g. ₹50,000 capital → ₹49,420 equities + ₹580 cash buffer).
- [x] Updates the 1-Click Broker Order Sheet (Zerodha CSV and Groww format) to reflect discrete integer quantities.
- [x] Passes automated unit and integration tests validating integer constraints and non-negative cash balances.
