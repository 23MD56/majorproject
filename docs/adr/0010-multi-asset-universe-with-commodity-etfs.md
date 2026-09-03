# Multi-Asset Investment Universe with Commodity ETFs

The recommendation engine's investment universe expands from NIFTY 50 equities to include Gold ETFs (GOLDBEES), Silver ETFs (SILVERBEES), select defense equities (HAL, BEL, BDL, MAZDOCK), and metals equities (TATASTEEL, HINDALCO, JSWSTEEL). All assets participate in the HRP portfolio optimization, not just in browsing.

## Context

The panel requested commodities (metals) and defense stocks. Including Gold and Silver ETFs in the HRP allocation is particularly valuable because their negative correlation with equities improves portfolio diversification — HRP will naturally allocate 5–15% to gold during high-volatility regimes, which is exactly the behavior a portfolio intelligence platform should exhibit.

## Considered Options

1. **NIFTY 50 only, browse-only expansion**: Let users see defense/metal stocks but only generate baskets from NIFTY 50. Rejected because the panel specifically asked for these in recommendations.
2. **Full multi-asset with MCX futures**: Include MCX Gold/Silver futures contracts. Rejected because futures have fundamentally different risk profiles (leverage, expiry, margin) that complicate the beginner-friendly narrative.
3. **Equities + ETFs (chosen)**: Gold/Silver ETFs trade on NSE just like equities — same OHLCV data, same settlement, same yfinance API. Defense and metals stocks are standard NSE equities. The existing GMM regime classifier needs no retraining (it classifies macro regime from NIFTY 50 + VIX). The forecaster extracts per-asset factors and works on any ticker with ≥252 days of history.

## Consequences

- `universe.py` gains an asset-class taxonomy (`EQUITY`, `COMMODITY_ETF`, `SECTORAL`).
- Portfolio Basket glossary definition changes from "NIFTY 50 equity assets" to "Indian equity and commodity ETF assets."
- The app tagline shifts from "NIFTY 50 AI Intelligence" to "Indian Equity Intelligence" or similar.
- HRP execution time increases marginally (50 → ~70 assets: ~3.5ms → ~5ms, negligible).
