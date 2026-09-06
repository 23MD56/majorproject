import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExplorePage } from "../../../../src/frontend/pages/ExplorePage";
import { useAppStore } from "../../../../src/frontend/store/useAppStore";

// Mock framer-motion to simplify DOM testing
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, className, onClick, ...props }: any) => (
        <div className={className} onClick={onClick} {...props}>
          {children}
        </div>
      ),
      button: ({ children, className, onClick, ...props }: any) => (
        <button className={className} onClick={onClick} {...props}>
          {children}
        </button>
      ),
      span: ({ children, className, ...props }: any) => (
        <span className={className} {...props}>
          {children}
        </span>
      ),
    },
  };
});

const MOCK_STOCKS = [
  {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries",
    sector: "Energy",
    current_price: 2980.5,
    day_change: 35.2,
    day_change_pct: 1.19,
    growth_6m_base_pct: 14.5,
    growth_6m_optimistic_pct: 22.0,
    growth_6m_pessimistic_pct: 4.2,
    regime_suitability_score: 88.5,
    regime_badge: "Strong Buy",
    volume: 12500000,
    asset_class: "EQUITY",
    esg_composite: 74.0,
    esg_badge: "Leader",
  },
  {
    symbol: "TCS.NS",
    name: "Tata Consultancy Services",
    sector: "Technology",
    current_price: 4120.0,
    day_change: -18.5,
    day_change_pct: -0.45,
    growth_6m_base_pct: 11.2,
    growth_6m_optimistic_pct: 18.4,
    growth_6m_pessimistic_pct: 2.1,
    regime_suitability_score: 72.0,
    regime_badge: "Hold",
    volume: 3800000,
    asset_class: "EQUITY",
    esg_composite: 82.5,
    esg_badge: "Leader",
  },
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank",
    sector: "Banking",
    current_price: 1640.25,
    day_change: 8.75,
    day_change_pct: 0.54,
    growth_6m_base_pct: 13.8,
    growth_6m_optimistic_pct: 20.5,
    growth_6m_pessimistic_pct: 3.5,
    regime_suitability_score: 82.0,
    regime_badge: "Strong Buy",
    volume: 18200000,
    asset_class: "EQUITY",
    esg_composite: 78.0,
    esg_badge: "Leader",
  },
  {
    symbol: "TATAMOTORS.NS",
    name: "Tata Motors",
    sector: "Auto",
    current_price: 980.0,
    day_change: -12.0,
    day_change_pct: -1.21,
    growth_6m_base_pct: 6.5,
    growth_6m_optimistic_pct: 12.0,
    growth_6m_pessimistic_pct: -2.0,
    regime_suitability_score: 55.0,
    regime_badge: "Caution",
    volume: 9500000,
    asset_class: "EQUITY",
    esg_composite: 68.0,
    esg_badge: "Average",
  },
];

const MOCK_PROFILE_RELIANCE = {
  symbol: "RELIANCE.NS",
  name: "Reliance Industries",
  sector: "Energy",
  current_price: 2980.5,
  day_change: 35.2,
  day_change_pct: 1.19,
  day_high: 3010.0,
  day_low: 2960.0,
  week_52_high: 3217.9,
  week_52_low: 2220.3,
  volume: 12500000,
  as_of_date: "2026-09-06",
  forecast: {
    symbol: "RELIANCE.NS",
    current_price: 2980.5,
    as_of_date: "2026-09-06",
    m1: {
      horizon: "1M",
      days: 30,
      pessimistic_pct: 1.2,
      base_pct: 3.5,
      optimistic_pct: 6.8,
      pessimistic_price: 3016.2,
      base_price: 3084.8,
      optimistic_price: 3183.1,
    },
    m3: {
      horizon: "3M",
      days: 90,
      pessimistic_pct: 2.8,
      base_pct: 7.9,
      optimistic_pct: 13.5,
      pessimistic_price: 3063.9,
      base_price: 3215.9,
      optimistic_price: 3382.8,
    },
    m6: {
      horizon: "6M",
      days: 180,
      pessimistic_pct: 4.2,
      base_pct: 14.5,
      optimistic_pct: 22.0,
      pessimistic_price: 3105.6,
      base_price: 3412.6,
      optimistic_price: 3636.2,
    },
    m12: {
      horizon: "12M",
      days: 365,
      pessimistic_pct: 8.0,
      base_pct: 24.2,
      optimistic_pct: 38.5,
      pessimistic_price: 3218.9,
      base_price: 3701.7,
      optimistic_price: 4128.0,
    },
  },
  suitability: {
    score: 88.5,
    badge: "Strong Buy",
    primary_regime: "Bullish Momentum",
    description: "High relative strength and strong upward momentum in current trending regime.",
  },
  factors: {
    rsi_14: 64.2,
    macd: 18.5,
    macd_hist: 4.2,
    bollinger_pct_b: 0.78,
    ema_20_50_spread: 2.4,
    ema_50_200_spread: 8.1,
    momentum_1m: 3.5,
    momentum_3m: 7.9,
    momentum_6m: 14.5,
    momentum_12m: 24.2,
    realized_vol_30d: 16.4,
    realized_vol_90d: 18.2,
    max_drawdown_1y: -11.5,
    beta: 1.05,
    alpha_annualized: 4.8,
    market_correlation: 0.82,
  },
  benchmark_comparison: {
    stock_3y_return: 68.4,
    benchmark_3y_return: 46.2,
    alpha: 5.2,
    beta: 1.05,
    correlation: 0.82,
  },
  peers: [
    {
      symbol: "ONGC.NS",
      name: "Oil and Natural Gas Corp",
      sector: "Energy",
      current_price: 284.0,
      day_change_pct: 0.8,
      base_growth_6m: 9.8,
    },
  ],
  esg: {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries",
    sector: "Energy",
    esg_composite: 74.0,
    esg_environment: 68.0,
    esg_social: 76.0,
    esg_governance: 78.0,
    badge: "Leader",
    source: "BRSR / CRISIL ESG",
  },
};

const MOCK_PROFILE_TCS = {
  ...MOCK_PROFILE_RELIANCE,
  symbol: "TCS.NS",
  name: "Tata Consultancy Services",
  sector: "Technology",
  current_price: 4120.0,
  suitability: {
    score: 72.0,
    badge: "Hold",
    primary_regime: "Range-Bound",
    description: "Consolidating near resistance with neutral momentum.",
  },
};

describe("ExplorePage Component Seam (Ticket 07)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState({
      allExploreStocks: MOCK_STOCKS,
      selectedStockSymbol: null,
    });

    global.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/explore/stocks")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_STOCKS),
        } as Response);
      }
      if (urlStr.includes("/api/explore/profile/RELIANCE.NS")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_PROFILE_RELIANCE),
        } as Response);
      }
      if (urlStr.includes("/api/explore/profile/TCS.NS")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_PROFILE_TCS),
        } as Response);
      }
      if (urlStr.includes("/api/backtest/run") || urlStr.includes("/quant-lab/backtest")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              backtest_id: "bt-test-123",
              symbol: "RELIANCE.NS",
              name: "Reliance Industries",
              strategy: "MA_CROSSOVER",
              start_date: "2023-01-01",
              end_date: "2026-09-01",
              initial_capital: 100000.0,
              metrics: {
                initial_capital: 100000.0,
                final_equity: 148500.0,
                total_return_pct: 48.5,
                cagr: 16.2,
                annualized_volatility: 14.8,
                sharpe_ratio: 1.45,
                sortino_ratio: 1.88,
                max_drawdown_pct: -8.4,
                calmar_ratio: 1.92,
                win_rate_pct: 64.0,
                profit_factor: 1.95,
                total_trades: 28,
                winning_trades: 18,
                losing_trades: 10,
                avg_trade_return_pct: 2.1,
                benchmark_total_return_pct: 32.0,
                benchmark_cagr: 11.4,
              },
              equity_curve: [
                {
                  date: "2025-01-01",
                  close_price: 2500,
                  signal: 1,
                  strategy_equity: 100000,
                  benchmark_equity: 100000,
                  drawdown_pct: 0,
                },
                {
                  date: "2026-01-01",
                  close_price: 2980,
                  signal: 1,
                  strategy_equity: 148500,
                  benchmark_equity: 132000,
                  drawdown_pct: -3.2,
                },
              ],
              trades: [],
              regime_breakdown: [
                {
                  regime: "Bullish Momentum",
                  days_count: 140,
                  strategy_return_pct: 24.5,
                  benchmark_return_pct: 18.2,
                  sharpe_ratio: 1.82,
                  max_drawdown_pct: -4.1,
                  win_rate_pct: 72.0,
                },
              ],
              parameters_used: { fast_period: 20, slow_period: 50 },
            }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders search bar and sector filter chips row", async () => {
    render(<ExplorePage />);

    expect(screen.getByPlaceholderText(/search stocks or symbols/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /^all$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /technology/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /banking/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /energy/i })).toBeDefined();
  });

  it("renders stock cards with bold name, price ticker, regime suitability badge, and 6M forecast bar", async () => {
    render(<ExplorePage />);

    await waitFor(() => {
      expect(screen.getByText("Reliance Industries")).toBeDefined();
    });

    // Check symbols and names
    expect(screen.getByText("RELIANCE.NS")).toBeDefined();
    expect(screen.getByText("Tata Consultancy Services")).toBeDefined();

    // Check regime suitability badges (Strong Buy, Hold, Caution)
    const strongBuyBadges = screen.getAllByText("Strong Buy");
    expect(strongBuyBadges.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Hold")).toBeDefined();
    expect(screen.getByText("Caution")).toBeDefined();

    // 6M forecast visual bar elements
    const forecastBars = screen.getAllByTestId("forecast-6m-bar");
    expect(forecastBars.length).toBeGreaterThanOrEqual(4);
  });

  it("filters stocks in-memory when user types into the search input", async () => {
    render(<ExplorePage />);

    await waitFor(() => {
      expect(screen.getByText("Reliance Industries")).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/search stocks or symbols/i);
    fireEvent.change(searchInput, { target: { value: "TCS" } });

    expect(screen.getByText("Tata Consultancy Services")).toBeDefined();
    expect(screen.queryByText("Reliance Industries")).toBeNull();
    expect(screen.queryByText("HDFC Bank")).toBeNull();

    // Clearing search restores all
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("Reliance Industries")).toBeDefined();
    expect(screen.getByText("HDFC Bank")).toBeDefined();
  });

  it("filters stock cards when clicking sector filter chips", async () => {
    render(<ExplorePage />);

    await waitFor(() => {
      expect(screen.getByText("Reliance Industries")).toBeDefined();
    });

    const techChip = screen.getByRole("button", { name: /technology/i });
    fireEvent.click(techChip);

    expect(screen.getByText("Tata Consultancy Services")).toBeDefined();
    expect(screen.queryByText("Reliance Industries")).toBeNull();
    expect(screen.queryByText("Tata Motors")).toBeNull();

    // Return to All
    const allChip = screen.getByRole("button", { name: /^all$/i });
    fireEvent.click(allChip);

    expect(screen.getByText("Reliance Industries")).toBeDefined();
    expect(screen.getByText("Tata Consultancy Services")).toBeDefined();
  });

  it("tapping a stock card opens the StockProfileModal with 360 intelligence data", async () => {
    render(<ExplorePage />);

    await waitFor(() => {
      expect(screen.getByText("Reliance Industries")).toBeDefined();
    });

    const card = screen.getByTestId("stock-card-RELIANCE.NS");
    fireEvent.click(card);

    // Profile modal sheet opens
    await waitFor(() => {
      expect(screen.getByTestId("stock-profile-modal")).toBeDefined();
    });

    // Check 360 intelligence profile sections: forecast cones, factors, and ESG
    await waitFor(() => {
      expect(screen.getByText(/360° intelligence profile/i)).toBeDefined();
      expect(screen.getByText(/forecast return cones/i)).toBeDefined();
      expect(screen.getByText(/technical factor snapshot/i)).toBeDefined();
      expect(screen.getByText(/esg sustainability/i)).toBeDefined();
    });
  });

  it("prevents race condition by discarding stale responses on rapid stock card taps", async () => {
    let resolveFirst: (val: any) => void;
    let resolveSecond: (val: any) => void;

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    global.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/explore/profile/RELIANCE.NS")) {
        return firstPromise as any;
      }
      if (urlStr.includes("/api/explore/profile/TCS.NS")) {
        return secondPromise as any;
      }
      if (urlStr.includes("/api/explore/stocks")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_STOCKS),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });

    render(<ExplorePage />);

    await waitFor(() => {
      expect(screen.getByText("Reliance Industries")).toBeDefined();
    });

    // Tap Reliance, then immediately tap TCS
    fireEvent.click(screen.getByTestId("stock-card-RELIANCE.NS"));
    fireEvent.click(screen.getByTestId("stock-card-TCS.NS"));

    // Now resolve first promise (Reliance) after TCS was clicked
    resolveFirst!({
      ok: true,
      json: () => Promise.resolve(MOCK_PROFILE_RELIANCE),
    });

    // Resolve second promise (TCS)
    resolveSecond!({
      ok: true,
      json: () => Promise.resolve(MOCK_PROFILE_TCS),
    });

    // The modal should display TCS profile data, NOT stale Reliance data
    await waitFor(() => {
      expect(screen.getByTestId("stock-profile-modal")).toBeDefined();
      expect(screen.getByText("TCS.NS")).toBeDefined();
    });
  });

  it("Pro Tools toggle is collapsed by default and reveals Quant Lab Backtester on toggle", async () => {
    render(<ExplorePage />);

    // Pro tools header exists
    const toggleButton = screen.getByRole("button", {
      name: /pro tools: quant lab backtester/i,
    });
    expect(toggleButton).toBeDefined();

    // Backtester controls not visible when collapsed
    expect(screen.queryByTestId("backtester-controls")).toBeNull();

    // Click toggle to expand
    fireEvent.click(toggleButton);

    // Now backtester controls and strategy selector are revealed
    await waitFor(() => {
      expect(screen.getByTestId("backtester-controls")).toBeDefined();
      expect(screen.getByText(/strategy/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /run backtest/i })).toBeDefined();
    });

    // Run backtest
    fireEvent.click(screen.getByRole("button", { name: /run backtest/i }));

    // Backtest results metrics and equity curve rendered
    await waitFor(() => {
      expect(screen.getByText(/total return/i)).toBeDefined();
      expect(screen.getByText(/sharpe ratio/i)).toBeDefined();
      expect(screen.getByTestId("backtest-equity-chart")).toBeDefined();
    });
  });
});
