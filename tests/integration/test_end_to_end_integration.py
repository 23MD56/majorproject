"""Comprehensive End-to-End Integration Tests for QuantNiti 4-Tab Workflows."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService


@pytest.fixture
def test_app(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    service = MarketDataService(provider=provider, cache=cache)
    return create_app(service=service)


@pytest.mark.asyncio
async def test_e2e_grow_basket_to_virtual_portfolio_lifecycle(test_app):
    """End-to-End Journey 1:
    1. Check Market Regime.
    2. Generate AI Basket recommendation (Grow Tab).
    3. Verify 3-tier Rupee growth scenarios & Trust Card pillars.
    4. Activate recommended basket directly into a Virtual Paper Portfolio (Portfolio Tab).
    5. Check live mark-to-market valuation, P&L, and benchmark alpha vs NIFTY 50 and Bank FD.
    6. Evaluate Regime-Shift Rebalance diff recommendation.
    7. Apply rebalance to portfolio.
    8. Generate 1-Click Broker Order Sheet (Zerodha CSV / Groww Text).
    """
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Check Current Market Regime
        regime_resp = await client.get("/api/regime/current")
        assert regime_resp.status_code == 200
        regime_data = regime_resp.json()
        assert "regime" in regime_data
        assert regime_data["confidence"] > 0.0

        # Step 2: Generate AI Portfolio Basket Recommendation (Grow Tab)
        grow_payload = {
            "capital": 100000.0,
            "horizon": "6M",
            "risk_persona": "Balanced",
        }
        grow_resp = await client.post("/api/grow/recommend", json=grow_payload)
        assert grow_resp.status_code == 200
        basket_data = grow_resp.json()
        assert "basket_id" in basket_data
        assert len(basket_data["allocations"]) > 0
        total_weight = sum(item["weight"] for item in basket_data["allocations"])
        assert pytest.approx(total_weight, rel=1e-3) == 1.0

        # Step 3: Verify 3-Tier Rupee Projections & Trust Card Pillars
        growth_projections = basket_data["growth_projections"]
        assert growth_projections["capital"] == 100000.0
        assert growth_projections["optimistic"]["projected_value"] >= growth_projections["base"]["projected_value"]
        assert growth_projections["base"]["projected_value"] >= growth_projections["pessimistic"]["projected_value"]

        trust_card = basket_data["trust_card"]
        assert "regime_context" in trust_card
        assert "model_reliability" in trust_card
        assert "drawdown_guardrail" in trust_card
        assert "disintermediation_savings" in trust_card
        assert trust_card["model_reliability"]["backtested_hit_rate_pct"] > 0.0

        # Step 4: Activate Basket into Virtual Paper Portfolio (Portfolio Tab)
        port_payload = {
            "name": "My Balanced AI Growth Portfolio",
            "capital": 100000.0,
            "basket_id": basket_data["basket_id"],
            "horizon": "6M",
            "risk_persona": "Balanced",
        }
        create_resp = await client.post("/api/portfolio/create", json=port_payload)
        assert create_resp.status_code == 200
        port_data = create_resp.json()
        portfolio_id = port_data["portfolio_id"]
        assert portfolio_id is not None
        assert len(port_data["holdings"]) == len(basket_data["allocations"])
        assert port_data["initial_capital"] == 100000.0

        # Step 5: Check Live Mark-to-Market Valuation & Benchmark Alpha
        get_port_resp = await client.get(f"/api/portfolio/{portfolio_id}")
        assert get_port_resp.status_code == 200
        active_port = get_port_resp.json()
        assert active_port["current_value"] > 0
        assert active_port["benchmark_comparison"] is not None
        assert "alpha_vs_nifty" in active_port["benchmark_comparison"]
        assert "alpha_vs_fd" in active_port["benchmark_comparison"]

        # Step 6: Evaluate Regime-Shift Rebalance Diff
        rebal_resp = await client.get(f"/api/portfolio/{portfolio_id}/rebalance")
        assert rebal_resp.status_code == 200
        rebal_data = rebal_resp.json()
        assert rebal_data["portfolio_id"] == portfolio_id
        assert isinstance(rebal_data["is_rebalance_recommended"], bool)
        assert len(rebal_data["items"]) > 0

        # Step 7: Apply Rebalance to Portfolio
        apply_resp = await client.post(f"/api/portfolio/{portfolio_id}/rebalance/apply")
        assert apply_resp.status_code == 200
        rebalanced_port = apply_resp.json()
        assert len(rebalanced_port["holdings"]) > 0

        # Step 8: Generate 1-Click Broker Order Sheet
        sheet_resp = await client.get(f"/api/portfolio/{portfolio_id}/order-sheet")
        assert sheet_resp.status_code == 200
        sheet_data = sheet_resp.json()
        assert sheet_data["portfolio_id"] == portfolio_id
        assert sheet_data["total_orders"] > 0
        assert "zerodha_csv_text" in sheet_data
        assert "groww_clipboard_text" in sheet_data
        assert len(sheet_data["zerodha_csv_text"]) > 0
        assert len(sheet_data["groww_clipboard_text"]) > 0


@pytest.mark.asyncio
async def test_e2e_explore_stock_to_quant_lab_backtest_journey(test_app):
    """End-to-End Journey 2:
    1. Search & Filter stocks in Explore Tab.
    2. Retrieve 360° Stock Intelligence Profile for a selected stock (e.g. INFY).
    3. Verify Multi-Horizon probabilistic return cones (1M, 3M, 6M, 12M).
    4. Run technical strategy backtest in Quant Lab Studio on the selected stock.
    5. Verify performance metrics (CAGR, Sharpe, Sortino, Max Drawdown, Alpha, Beta)
       and historical regime attribution breakdown.
    """
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: List & Search stocks in Explore Tab
        explore_resp = await client.get("/api/explore/stocks?sector=Information Technology")
        assert explore_resp.status_code == 200
        it_stocks = explore_resp.json()
        assert len(it_stocks) > 0
        assert any(s["symbol"] == "INFY" for s in it_stocks)
        infy_summary = next(s for s in it_stocks if s["symbol"] == "INFY")
        assert infy_summary["growth_6m_base_pct"] is not None
        assert infy_summary["regime_suitability_score"] > 0.0

        # Step 2: Retrieve 360° Stock Intelligence Profile
        profile_resp = await client.get("/api/explore/profile/INFY")
        assert profile_resp.status_code == 200
        profile = profile_resp.json()
        assert profile["symbol"] == "INFY"
        assert profile["current_price"] > 0.0
        assert profile["forecast"] is not None
        assert profile["factors"]["rsi_14"] > 0.0
        assert profile["suitability"]["score"] > 0.0
        assert len(profile["peers"]) > 0

        # Step 3: Verify Multi-Horizon Probabilistic Return Cones
        forecast_resp = await client.get("/api/explore/forecast/INFY")
        assert forecast_resp.status_code == 200
        forecast = forecast_resp.json()
        for horizon in ["m1", "m3", "m6", "m12"]:
            cone = forecast[horizon]
            assert cone["optimistic_pct"] >= cone["base_pct"] >= cone["pessimistic_pct"]
            assert cone["optimistic_price"] >= cone["base_price"] >= cone["pessimistic_price"]

        # Step 4: Run Quant Lab Strategy Backtest on INFY
        backtest_payload = {
            "symbol": "INFY",
            "strategy": "Moving Average Crossover",
            "initial_capital": 100000.0,
            "cost_bps": 5.0,
            "slippage_bps": 5.0,
            "parameters": {"fast_period": 20, "slow_period": 50},
        }
        bt_resp = await client.post("/api/backtest/run", json=backtest_payload)
        assert bt_resp.status_code == 200
        bt_data = bt_resp.json()
        assert bt_data["symbol"] == "INFY"
        assert bt_data["strategy"] == "Moving Average Crossover"
        assert len(bt_data["equity_curve"]) > 0
        assert bt_data["metrics"]["cagr"] is not None
        assert bt_data["metrics"]["sharpe_ratio"] is not None
        assert bt_data["metrics"]["max_drawdown_pct"] <= 0.0 or bt_data["metrics"]["max_drawdown_pct"] >= -100.0
        assert len(bt_data["regime_breakdown"]) > 0


@pytest.mark.asyncio
async def test_e2e_quant_lab_multi_strategy_suite(test_app):
    """End-to-End Journey 3:
    Verifies that all 5 technical trading strategies supported in Quant Lab Studio
    execute smoothly with valid equity curves, drawdowns, and regime breakdowns.
    """
    transport = ASGITransport(app=test_app)
    strategies = [
        "Buy & Hold",
        "Moving Average Crossover",
        "RSI Mean Reversion",
        "Bollinger Band Breakout",
        "Dual Momentum",
    ]

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for strat in strategies:
            payload = {
                "symbol": "^NSEI",
                "strategy": strat,
                "initial_capital": 50000.0,
            }
            resp = await client.post("/api/backtest/run", json=payload)
            assert resp.status_code == 200, f"Strategy {strat} failed with status {resp.status_code}"
            data = resp.json()
            assert data["strategy"] == strat
            assert data["metrics"]["final_equity"] > 0
            assert len(data["equity_curve"]) > 0
            assert len(data["regime_breakdown"]) > 0


@pytest.mark.asyncio
async def test_e2e_regime_radar_history_endpoint(test_app):
    """End-to-End Journey 4:
    Verifies Market Regime radar and historical timeline series for UI rendering.
    """
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        hist_resp = await client.get("/api/regime/history")
        assert hist_resp.status_code == 200
        hist_data = hist_resp.json()
        assert hist_data["count"] > 0
        assert "regime_distribution" in hist_data
        assert len(hist_data["data"]) == hist_data["count"]
        sample = hist_data["data"][0]
        assert "probabilities" in sample
        assert sample["probabilities"]["bull"] >= 0.0
