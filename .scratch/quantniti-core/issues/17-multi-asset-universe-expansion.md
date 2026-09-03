# 17: Expanded Multi-Asset Universe (Commodity ETFs, Defense & Metals)

**What to build:** Expand the investment universe from 50 NIFTY equities to include Gold and Silver ETFs (`GOLDBEES.NS`, `SILVERBEES.NS`), Indian Defense equities (`HAL.NS`, `BEL.NS`, `BDL.NS`, `MAZDOCK.NS`, `COCHINSHIP.NS`), and Metals leaders (`TATASTEEL.NS`, `HINDALCO.NS`, `JSWSTEEL.NS`, `VEDL.NS`, `JINDALSTEL.NS`). Ingest historical OHLCV data, extract technical factors, map sector taxonomies, and enable all assets to participate in the Hierarchical Risk Parity (HRP) portfolio basket generation.

**Blocked by:** 01: Data Ingestion & NIFTY 50 Market Data Service, 04: AI Portfolio Basket Engine & Trust Card

**Status:** done

- [x] Extends `src/app/universe.py` with an asset taxonomy (`EQUITY`, `COMMODITY_ETF`, `SECTORAL`) supporting Gold/Silver ETFs, Defense stocks, and Metals stocks.
- [x] Enhances the data ingestion service to download, clean, and cache historical daily price series for all new assets.
- [x] Verifies that the multi-horizon factor extractor (`src/app/ml/forecasting/factors.py`) generates valid beta, momentum, and volatility factors for the new assets.
- [x] Integrates commodity ETFs and sectoral assets into the Hierarchical Risk Parity (HRP) allocation pipeline, verifying that Gold/Silver ETFs are allocated non-zero defensive weights during high-volatility regimes.
- [x] Adds sector/theme filter chips (`Defense`, `Metals`, `Commodities`) in the Explore tab asset browser.
- [x] Passes automated unit and integration tests: historical data exists for all assets, covariance matrix computation succeeds with Ledoit-Wolf shrinkage, and basket optimization generates valid weights ($\sum w_i = 1.0$).
