import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../../src/frontend/App";
import { useAppStore } from "../../../src/frontend/store/useAppStore";
import { abortRegistry } from "../../../src/frontend/services/abortRegistry";
import * as pwaService from "../../../src/frontend/services/pwaService";

// Mock framer-motion for reliable, zero-latency integration testing
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: () => true,
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
      aside: ({ children, className, ...props }: any) => (
        <aside className={className} {...props}>
          {children}
        </aside>
      ),
      span: ({ children, className, ...props }: any) => (
        <span className={className} {...props}>
          {children}
        </span>
      ),
      header: ({ children, className, ...props }: any) => (
        <header className={className} {...props}>
          {children}
        </header>
      ),
    },
  };
});

const MOCK_BASKET = {
  basket_id: "basket-test-full-app",
  capital: 50000,
  horizon: "6M",
  risk_persona: "Balanced",
  active_regime: "Low-Volatility Bull",
  total_invested: 44250,
  unallocated_cash: 5750,
  cash_buffer_pct: 11.5,
  portfolio_esg_score: 82.5,
  portfolio_esg_badge: "🟢 Strong ESG",
  portfolio_esg_breakdown: {
    Environmental: 85,
    Social: 78,
    Governance: 84,
  },
  allocations: [
    { symbol: "RELIANCE", weight: 0.28, shares: 5, allocated_amount: 14000 },
    { symbol: "TCS", weight: 0.24, shares: 3, allocated_amount: 12000 },
    { symbol: "GOLDBEES", weight: 0.20, shares: 150, allocated_amount: 10000 },
    { symbol: "HDFCBANK", weight: 0.16, shares: 5, allocated_amount: 8250 },
  ],
  growth_projections: {
    pessimistic_q10: { return_pct: -3.5, final_value: 48250 },
    base_q50: { return_pct: 9.4, final_value: 54700 },
    optimistic_q90: { return_pct: 18.2, final_value: 59100 },
  },
  trust_card: {
    pillar_1_regime_suitability: "Low-Volatility Bull Optimal",
    pillar_2_hit_rate: "71.2% Backtested Win Rate",
    pillar_3_drawdown: "Capped at < 10% Max Drawdown",
    pillar_4_fee_savings: "Save ~₹3,400 vs Traditional Funds",
  },
};

describe("QuantNiti Full Application Integration Suite (Ticket 11)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    window.location.hash = "";
    vi.restoreAllMocks();

    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("/api/explore/stocks")) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    useAppStore.setState({
      activeTab: "home",
      theme: "light",
      isOnboarded: false,
      riskPersona: "Balanced",
      horizon: "6M",
      capital: 50000,
      activePortfolio: null,
      portfolios: [],
      activePortfolioId: null,
      currentBasket: null,
      activeModal: null,
      modalPayload: null,
      activeRegime: {
        regime: "BULL",
        probabilities: { BULL: 0.7, SIDEWAYS: 0.2, BEAR: 0.1 },
        confidence: 0.85,
        description: "Macro momentum strong with positive FII flows.",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. ONBOARDING LIFECYCLE
  // ---------------------------------------------------------------------------
  describe("1. Onboarding Flow Seam", () => {
    it("first visit shows onboarding hero; quiz completion transitions to Home and persists persona", async () => {
      const user = userEvent.setup();
      render(<App />);

      expect(await screen.findByTestId("onboarding-hero")).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: /home/i })).not.toBeInTheDocument();

      const getStartedBtn = await screen.findByRole("button", { name: /get started/i });
      await user.click(getStartedBtn);

      const q1Option = await screen.findByRole("button", { name: /Exit & preserve cash/i });
      await user.click(q1Option);
      await user.click(screen.getByRole("button", { name: /continue|next/i }));

      const q2Option = await screen.findByRole("button", { name: /3 to 6 Months/i });
      await user.click(q2Option);
      await user.click(screen.getByRole("button", { name: /continue|next/i }));

      const q3Option = await screen.findByRole("button", { name: /Capital Safety/i });
      await user.click(q3Option);
      await user.click(screen.getByRole("button", { name: /see my profile|continue|next/i }));

      expect(await screen.findByText(/Conservative Investor/i)).toBeInTheDocument();

      const enterBtn = screen.getByRole("button", { name: /enter quantniti/i });
      await user.click(enterBtn);

      expect(await screen.findByRole("tab", { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /explore/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /grow/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /portfolio/i })).toBeInTheDocument();

      expect(localStorage.getItem("quantniti_onboarded")).toBe("true");
      expect(localStorage.getItem("quantniti_risk_persona")).toBe("Conservative");
      expect(useAppStore.getState().isOnboarded).toBe(true);
    }, 15000);

    it("second visit skips onboarding overlay entirely and lands straight on Home", async () => {
      localStorage.setItem("quantniti_onboarded", "true");
      localStorage.setItem("quantniti_risk_persona", "Aggressive");
      useAppStore.setState({
        isOnboarded: true,
        riskPersona: "Aggressive",
        activeTab: "home",
      });

      render(<App />);

      expect(screen.queryByTestId("onboarding-hero")).not.toBeInTheDocument();
      expect(await screen.findByRole("tab", { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /home/i })).toHaveAttribute("aria-selected", "true");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. HOME TAB COMPONENTS
  // ---------------------------------------------------------------------------
  describe("2. Home Tab Intelligence Seam", () => {
    beforeEach(() => {
      localStorage.setItem("quantniti_onboarded", "true");
      useAppStore.setState({ isOnboarded: true, activeTab: "home" });
    });

    it("renders Market Pulse, Regime Radar, and switches Adaptive Card based on portfolio state", async () => {
      useAppStore.setState({ activePortfolio: null });
      const { unmount } = render(<App />);

      expect(await screen.findByTestId("market-pulse-card")).toBeInTheDocument();
      expect(screen.getByText(/NIFTY 50/i)).toBeInTheDocument();
      expect(screen.getByText(/Regime Radar/i)).toBeInTheDocument();
      expect(screen.getByText(/Start Your Investment Journey/i)).toBeInTheDocument();
      expect(screen.queryByTestId("portfolio-snapshot-card")).not.toBeInTheDocument();

      unmount();

      useAppStore.setState({
        activePortfolio: {
          id: "port_active_1",
          name: "Virtual Paper Basket",
          current_value: 54500,
          invested_capital: 50000,
          total_pnl: 4500,
          total_pnl_pct: 9.0,
          holdings: [
            { symbol: "RELIANCE.NS", shares: 10, weight: 0.5 },
            { symbol: "TCS.NS", shares: 5, weight: 0.5 },
          ],
          benchmark_comparison: { alpha_vs_nifty: 4.2 },
        },
      });

      render(<App />);
      expect(await screen.findByTestId("portfolio-snapshot-card")).toBeInTheDocument();
      expect(screen.getByText(/Overall P&L/i)).toBeInTheDocument();
      expect(screen.queryByText(/Start Your Investment Journey/i)).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. EXPLORE TAB & PRO TOOLS BACKTESTER
  // ---------------------------------------------------------------------------
  describe("3. Explore Tab & Pro Tools Seam", () => {
    beforeEach(() => {
      localStorage.setItem("quantniti_onboarded", "true");
      useAppStore.setState({ isOnboarded: true, activeTab: "home" });
    });

    it("navigates to Explore tab, renders stock cards, filters by search, and toggles Pro Tools backtester", async () => {
      const user = userEvent.setup();
      render(<App />);

      const exploreTab = await screen.findByRole("tab", { name: /explore/i });
      await user.click(exploreTab);

      expect(await screen.findByText("RELIANCE.NS")).toBeInTheDocument();
      expect(screen.getByText("TCS.NS")).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/Search stocks or symbols/i);
      await user.type(searchInput, "TCS");
      expect(screen.getByText("TCS.NS")).toBeInTheDocument();
      expect(screen.queryByText("RELIANCE.NS")).not.toBeInTheDocument();

      await user.clear(searchInput);
      expect(screen.getByText("RELIANCE.NS")).toBeInTheDocument();

      const proToolsToggle = await screen.findByTestId("pro-tools-toggle");
      expect(proToolsToggle).toBeInTheDocument();
      await user.click(proToolsToggle);

      expect(await screen.findByTestId("backtester-controls")).toBeInTheDocument();
      expect(screen.getByText(/Run Backtest/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. GROW TAB GUIDED BUILDER
  // ---------------------------------------------------------------------------
  describe("4. Grow Tab Guided Builder Seam", () => {
    beforeEach(() => {
      localStorage.setItem("quantniti_onboarded", "true");
      useAppStore.setState({ isOnboarded: true, activeTab: "home", capital: 50000 });
    });

    it("navigates wizard steps, generates basket, and renders allocation results", async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn().mockImplementation((url) => {
        if (typeof url === "string" && (url.includes("recommend") || url.includes("generate-basket"))) {
          return Promise.resolve({
            ok: true,
            json: async () => MOCK_BASKET,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      render(<App />);

      const growTab = await screen.findByRole("tab", { name: /grow/i });
      await user.click(growTab);

      expect(await screen.findByText("Fifty Thousand Only")).toBeInTheDocument();
      const toHorizonBtn = screen.getByRole("button", { name: /continue to horizon/i });
      await user.click(toHorizonBtn);

      expect(await screen.findByText(/Choose your investment horizon/i)).toBeInTheDocument();
      const toPersonaBtn = screen.getByRole("button", { name: /continue to persona/i });
      await user.click(toPersonaBtn);

      expect(await screen.findByText(/Select your risk tolerance/i)).toBeInTheDocument();
      const reviewGenerateBtn = screen.getByRole("button", { name: /Review & Generate/i });
      await user.click(reviewGenerateBtn);

      expect(await screen.findByText(/Your Optimized AI Basket/i)).toBeInTheDocument();
      expect(screen.getByText("RELIANCE")).toBeInTheDocument();
      expect(screen.getByText("TCS")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. PORTFOLIO TAB (DEMO VS REAL)
  // ---------------------------------------------------------------------------
  describe("5. Portfolio Tab Seam", () => {
    beforeEach(() => {
      localStorage.setItem("quantniti_onboarded", "true");
      useAppStore.setState({ isOnboarded: true, activeTab: "home" });
    });

    it("displays Demo Portfolio mode initially, then real portfolio when created", async () => {
      const user = userEvent.setup();
      render(<App />);

      const portfolioTab = await screen.findByRole("tab", { name: /portfolio/i });
      await user.click(portfolioTab);

      expect(await screen.findByText(/DEMO PREVIEW/i)).toBeInTheDocument();
      expect(screen.getByText(/This is a demo portfolio/i)).toBeInTheDocument();

      const realPortfolio = {
        portfolio_id: "port_real_1",
        name: "Retirement 2050",
        initial_capital: 200000,
        cash: 20000,
        invested_capital: 180000,
        current_value: 205000,
        total_pnl: 5000,
        total_pnl_pct: 2.5,
        pnl_1d: 1200,
        pnl_1d_pct: 0.6,
        max_drawdown_pct: 1.2,
        holdings: [
          {
            symbol: "RELIANCE",
            shares: 20,
            avg_price: 2500,
            current_price: 3000,
            current_value: 60000,
            pnl: 10000,
            pnl_pct: 20.0,
            weight: 0.3,
            sector: "Energy",
            regime_suitability: "BULL",
          },
        ],
        benchmark_comparison: {
          portfolio_return_pct: 2.5,
          nifty_return_pct: 1.8,
          bank_fd_return_pct: 0.8,
          alpha_vs_nifty: 0.7,
          alpha_vs_fd: 1.7,
        },
        initial_regime: "BULL_TRENDING",
        current_regime: "BULL_TRENDING",
        risk_persona: "Balanced",
        horizon: "12M",
        created_at: new Date().toISOString(),
        as_of_date: "2026-09-06",
      };

      useAppStore.setState({
        portfolios: [realPortfolio],
        activePortfolioId: "port_real_1",
      });

      expect(await screen.findByText(/Retirement 2050/i)).toBeInTheDocument();
      expect(screen.queryByText(/DEMO PREVIEW/i)).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. TAB SWITCHING & ASYNC REQUEST ABORT CLEANUP
  // ---------------------------------------------------------------------------
  describe("6. Tab Switching & Async Abort Seam", () => {
    beforeEach(() => {
      localStorage.setItem("quantniti_onboarded", "true");
      useAppStore.setState({ isOnboarded: true, activeTab: "home" });
    });

    it("switching tabs cancels in-flight async operations via abortRegistry.abortAll", async () => {
      const user = userEvent.setup();
      const abortSpy = vi.spyOn(abortRegistry, "abortAll");

      render(<App />);

      const exploreTab = await screen.findByRole("tab", { name: /explore/i });
      await user.click(exploreTab);

      expect(abortSpy).toHaveBeenCalledWith("tab-switch");
      expect(window.location.hash).toContain("explore");

      const growTab = screen.getByRole("tab", { name: /grow/i });
      await user.click(growTab);

      expect(abortSpy).toHaveBeenCalledWith("tab-switch");
      expect(window.location.hash).toContain("grow");

      const brandLink = screen.getByRole("link", { name: /quantniti home/i });
      await user.click(brandLink);

      expect(abortSpy).toHaveBeenCalledWith("tab-switch");
      expect(window.location.hash).toContain("home");
    });
  });

  // ---------------------------------------------------------------------------
  // 7. THEME TOGGLE PERSISTENCE
  // ---------------------------------------------------------------------------
  describe("7. Theme Toggle Seam", () => {
    beforeEach(() => {
      localStorage.setItem("quantniti_onboarded", "true");
      useAppStore.setState({ isOnboarded: true, activeTab: "home", theme: "light" });
    });

    it("toggles light ↔ dark theme, persists in localStorage, and updates document attribute", async () => {
      const user = userEvent.setup();
      render(<App />);

      const themeToggleBtn = await screen.findByTestId("theme-toggle-btn");
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");

      await user.click(themeToggleBtn);
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      expect(localStorage.getItem("quantniti_theme")).toBe("dark");

      await user.click(themeToggleBtn);
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
      expect(localStorage.getItem("quantniti_theme")).toBe("light");
    });
  });

  // ---------------------------------------------------------------------------
  // 8. MODALS & OVERLAYS INTEGRATION
  // ---------------------------------------------------------------------------
  describe("8. Modals & Overlays Seam", () => {
    beforeEach(() => {
      localStorage.setItem("quantniti_onboarded", "true");
      useAppStore.setState({ isOnboarded: true, activeTab: "home" });
    });

    it("opens NitiBot modal via FAB, closes via close button", async () => {
      const user = userEvent.setup();
      render(<App />);

      const fabBtn = await screen.findByRole("button", { name: /Ask NitiBot AI/i });
      await user.click(fabBtn);

      expect(await screen.findByText("NitiBot AI")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ask about regimes/i)).toBeInTheDocument();

      const closeBtn = screen.getByRole("button", { name: /close/i });
      await user.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText("NitiBot AI")).not.toBeInTheDocument();
      });
    });

    it("opens Smart Notification drawer via bell button and closes via close button", async () => {
      const user = userEvent.setup();
      render(<App />);

      const bellBtn = await screen.findByTestId("notification-bell-btn");
      await user.click(bellBtn);

      expect(await screen.findByText(/Smart Notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/Quantitative Risk & Regime Monitor/i)).toBeInTheDocument();

      const closeBtn = screen.getByRole("button", { name: /close/i });
      await user.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Smart Notifications/i)).not.toBeInTheDocument();
      });
    });

    it("triggers PWA install from header overflow menu", async () => {
      const user = userEvent.setup();
      const promptSpy = vi.spyOn(pwaService, "promptPWAInstall").mockResolvedValue("accepted");

      render(<App />);

      const overflowBtn = await screen.findByTestId("overflow-menu-btn");
      await user.click(overflowBtn);

      const installBtn = await screen.findByTestId("pwa-install-btn");
      await user.click(installBtn);

      expect(promptSpy).toHaveBeenCalled();
    });
  });
});
