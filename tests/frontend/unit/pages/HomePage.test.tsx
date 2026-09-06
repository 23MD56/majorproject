import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { HomePage } from "../../../../src/frontend/pages/HomePage";
import { useAppStore } from "../../../../src/frontend/store/useAppStore";

describe("HomePage Component Seam (Ticket 06)", () => {
  beforeEach(() => {
    useAppStore.setState({
      activePortfolio: null,
      activeRegime: {
        regime: "BULL",
        probabilities: { BULL: 0.68, SIDEWAYS: 0.22, BEAR: 0.10 },
        confidence: 0.85,
        description: "Macro momentum strong with positive FII flows and low volatility.",
      },
      allExploreStocks: [
        { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy & Oil", current_price: 2980.5, growth_6m_base_pct: 18.2, day_change_pct: 1.2 },
        { symbol: "TCS", name: "Tata Consultancy Services", sector: "Information Technology", current_price: 4120.0, growth_6m_base_pct: 14.5, day_change_pct: -0.4 },
        { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Financial Services", current_price: 1680.0, growth_6m_base_pct: 12.1, day_change_pct: 0.8 },
      ],
      literacyCards: [
        { key: "regime-investing", title: "Market Regimes 101", summary: "Learn how market regimes protect capital.", category: "Strategy", read_time_min: 3 },
        { key: "sharpe-ratio", title: "Understanding Sharpe", summary: "Risk-adjusted returns made simple.", category: "Metrics", read_time_min: 2 },
      ],
    });
  });

  const renderHomePage = () => {
    return render(
      <HashRouter>
        <HomePage />
      </HashRouter>
    );
  };

  it("renders Market Pulse with live NIFTY 50 data", () => {
    renderHomePage();
    expect(screen.getByText(/NIFTY 50/i)).toBeInTheDocument();
    expect(screen.getByTestId("market-pulse-card")).toBeInTheDocument();
  });

  it("renders Regime Radar with probability bars and regime badge", () => {
    renderHomePage();
    expect(screen.getByText(/Regime Radar/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bull/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Sideways/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Bear/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows OnboardingCard when no portfolio exists, and PortfolioSnapshot when portfolio exists", () => {
    // 1. No portfolio -> OnboardingCard
    useAppStore.setState({ activePortfolio: null });
    const { unmount } = renderHomePage();

    expect(screen.getByText(/Start Your Investment Journey/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore stocks/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /build basket/i })).toBeInTheDocument();
    expect(screen.queryByTestId("portfolio-snapshot-card")).not.toBeInTheDocument();

    unmount();

    // 2. Portfolio exists -> PortfolioSnapshot
    useAppStore.setState({
      activePortfolio: {
        id: "port_1",
        name: "Virtual Paper Basket",
        current_value: 54200,
        invested_capital: 50000,
        total_pnl: 4200,
        total_pnl_pct: 8.4,
        holdings: [
          { symbol: "RELIANCE", shares: 10, weight: 0.5 },
          { symbol: "TCS", shares: 5, weight: 0.5 },
        ],
        benchmark_comparison: { alpha_vs_nifty: 3.2 },
      },
    });

    renderHomePage();
    expect(screen.getByTestId("portfolio-snapshot-card")).toBeInTheDocument();
    expect(screen.getByText(/Overall P&L/i)).toBeInTheDocument();
    expect(screen.queryByText(/Start Your Investment Journey/i)).not.toBeInTheDocument();
  });

  it("renders Top Recommendations with regime scored stocks and link to Explore", () => {
    renderHomePage();
    expect(screen.getByText(/Top Regime Picks/i)).toBeInTheDocument();
    expect(screen.getAllByText("RELIANCE").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("TCS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: /view all 50/i })).toBeInTheDocument();
  });

  it("renders Learning Hub with progress and interactive concept cards", () => {
    renderHomePage();
    expect(screen.getByText(/Financial Learning Hub/i)).toBeInTheDocument();
    expect(screen.getByText(/Market Regimes 101/i)).toBeInTheDocument();
    expect(screen.getByText(/Understanding Sharpe/i)).toBeInTheDocument();
  });

  it("renders Compounding Visualizer with interactive sliders and calculated output", () => {
    renderHomePage();
    expect(screen.getByText(/Compounding Visualizer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly SIP/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tenure/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expected Return/i)).toBeInTheDocument();
    expect(screen.getByTestId("compounding-future-value")).toBeInTheDocument();
  });

  it("renders Video Facades section with lazy thumbnail cards", () => {
    renderHomePage();
    expect(screen.getByText(/Video Explainers/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("video-facade-card").length).toBeGreaterThanOrEqual(2);
  });
});
