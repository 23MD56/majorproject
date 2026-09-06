import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GrowPage } from "../../../../src/frontend/components/grow/GrowPage";
import { useAppStore } from "../../../../src/frontend/store/useAppStore";
import { abortRegistry } from "../../../../src/frontend/services/abortRegistry";

const MOCK_BASKET = {
  basket_id: "basket-test-123",
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
  benchmark_comparisons: [
    { name: "Bank Fixed Deposit", return_pct: 3.5, label: "Fixed Guarantee" },
    { name: "NIFTY 50 Benchmark", return_pct: 6.8, label: "Market Index" },
    { name: "QuantNiti AI Basket", return_pct: 9.4, label: "Regime-Adaptive", highlight: true },
  ],
};

describe("Grow Guided Flow & Results Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    abortRegistry.abortAll();
    useAppStore.setState({
      activeTab: "grow",
      capital: 50000,
      horizon: "6M",
      riskPersona: "Balanced",
      currentBasket: null,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("walks through 3 wizard steps and renders summary pills when progressing", async () => {
    const user = userEvent.setup();
    render(<GrowPage />);

    // Step 1: Capital
    expect(screen.getByText("Fifty Thousand Only")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue to horizon/i }));

    // Step 2: Horizon
    expect(await screen.findByText(/Choose your investment horizon/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Capital: ₹50,000/i })).toBeInTheDocument();
    const toPersonaBtn = await screen.findByRole("button", { name: /continue to persona/i });
    await user.click(toPersonaBtn);

    // Step 3: Persona
    expect(await screen.findByText(/Select your risk tolerance/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Capital: ₹50,000/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Horizon: 6M/i })).toBeInTheDocument();
  });

  it("triggers AI basket generation API, shows loading skeleton, and displays Results Overview", async () => {
    const user = userEvent.setup();

    // Mock fetch for basket generation
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_BASKET,
    });
    global.fetch = mockFetch;

    render(<GrowPage />);

    // Move Step 1 -> Step 2 -> Step 3
    await user.click(screen.getByRole("button", { name: /continue to horizon/i }));
    const toPersonaBtn = await screen.findByRole("button", { name: /continue to persona/i });
    await user.click(toPersonaBtn);

    // Step 3: Click Generate AI Basket
    const generateBtn = await screen.findByRole("button", { name: /generate ai basket/i });
    await user.click(generateBtn);

    // Verify API called
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/grow/recommend",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          capital: 50000,
          horizon: "6M",
          risk_persona: "Balanced",
        }),
      })
    );

    // Results Overview should be rendered
    expect(await screen.findByText(/Your Optimized AI Basket/i)).toBeInTheDocument();
    expect(screen.getByText("RELIANCE")).toBeInTheDocument();
    expect(screen.getByText("TCS")).toBeInTheDocument();
    expect(screen.getByText("GOLDBEES")).toBeInTheDocument();
    expect(screen.getByText("HDFCBANK")).toBeInTheDocument();

    // 3-tier growth scenarios
    expect(screen.getByText(/Pessimistic \(Q10\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Base Case \(Q50\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Optimistic \(Q90\)/i)).toBeInTheDocument();
    expect(screen.getByText("+9.4%")).toBeInTheDocument();
  });

  it("navigates to Step 5 Deep Dive and renders ESG Conscience Score and Trust Card", async () => {
    useAppStore.setState({
      currentBasket: MOCK_BASKET,
    });

    const user = userEvent.setup();
    render(<GrowPage />);

    // Results Overview is already active
    expect(await screen.findByText(/Your Optimized AI Basket/i)).toBeInTheDocument();

    // Click See Deep Dive
    const deepDiveBtn = screen.getByRole("button", { name: /see deep dive/i });
    await user.click(deepDiveBtn);

    // Deep Dive should be visible
    expect(await screen.findByText(/Trust & Intelligence Card/i)).toBeInTheDocument();
    expect(screen.getByText(/ESG Conscience Score/i)).toBeInTheDocument();
    expect(screen.getByText("82.5")).toBeInTheDocument();
    expect(screen.getByText(/🟢 Strong ESG/i)).toBeInTheDocument();

    // 4-Pillar Trust Card
    expect(screen.getByText(/Pillar 1: Regime Suitability/i)).toBeInTheDocument();
    expect(screen.getByText(/Pillar 2: Directional Hit Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Pillar 3: Stress Drawdown Limit/i)).toBeInTheDocument();
    expect(screen.getByText(/Pillar 4: Fee Savings/i)).toBeInTheDocument();

    // Benchmark comparison
    expect(screen.getByText(/Bank Fixed Deposit/i)).toBeInTheDocument();
    expect(screen.getByText(/NIFTY 50 Benchmark/i)).toBeInTheDocument();

    // Reviews
    expect(screen.getByText(/Community Reviews & Legitimacy/i)).toBeInTheDocument();
  });
});
