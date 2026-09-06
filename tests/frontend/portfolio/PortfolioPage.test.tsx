import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PortfolioPage } from "../../../src/frontend/components/portfolio/PortfolioPage";
import { useAppStore } from "../../../src/frontend/store/useAppStore";
import { DEMO_HOLDINGS } from "../../../src/frontend/components/portfolio/demoPortfolioData";

describe("PortfolioPage", () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      portfolios: [],
      activePortfolioId: null,
      activeTab: "portfolio",
    });
    localStorage.clear();
  });

  it("renders Demo Portfolio when no portfolios exist", () => {
    render(<PortfolioPage />);

    // Demo banner
    expect(screen.getByText(/This is a demo portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/DEMO PREVIEW/i)).toBeInTheDocument();
    expect(screen.getByText("RELIANCE")).toBeInTheDocument();
  });

  it("navigates to Grow tab when 'Build Your Own' is clicked in Demo state", () => {
    render(<PortfolioPage />);

    const buildBtns = screen.getAllByRole("button", { name: /Build Your Own/i });
    fireEvent.click(buildBtns[0]);

    expect(useAppStore.getState().activeTab).toBe("grow");
  });

  it("renders real portfolio data when a real portfolio is added", async () => {
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
      holdings: DEMO_HOLDINGS.slice(0, 3),
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

    render(<PortfolioPage />);

    // Demo banner should NOT be present
    expect(screen.queryByText(/This is a demo portfolio/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/DEMO PREVIEW/i)).not.toBeInTheDocument();

    // Real portfolio values
    expect(screen.getByText(/Retirement 2050/i)).toBeInTheDocument();
    expect(screen.getByText("₹2,05,000")).toBeInTheDocument();
  });

  it("allows creating a new goal portfolio via modal and switches out of demo mode", async () => {
    render(<PortfolioPage />);

    // Initially in Demo mode
    expect(screen.getByText(/This is a demo portfolio/i)).toBeInTheDocument();

    // Click "New Goal" button
    const newGoalBtn = screen.getByRole("button", { name: /New Goal/i });
    fireEvent.click(newGoalBtn);

    // Modal opens
    expect(screen.getByText(/Create New Goal Portfolio/i)).toBeInTheDocument();

    // Submit form
    const createBtn = screen.getByRole("button", { name: /Create Virtual Portfolio/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      // Demo banner should now disappear
      expect(screen.queryByText(/This is a demo portfolio/i)).not.toBeInTheDocument();
      expect(useAppStore.getState().portfolios.length).toBe(1);
    });
  });

  it("reverts to Demo Portfolio state when the last real portfolio is deleted", async () => {
    // Mock window.confirm
    vi.spyOn(window, "confirm").mockImplementation(() => true);

    const realPortfolio = {
      portfolio_id: "port_to_delete",
      name: "Short Term Goal",
      initial_capital: 50000,
      cash: 5000,
      invested_capital: 45000,
      current_value: 52000,
      total_pnl: 2000,
      total_pnl_pct: 4.0,
      pnl_1d: 300,
      pnl_1d_pct: 0.6,
      max_drawdown_pct: 0.5,
      holdings: DEMO_HOLDINGS.slice(0, 2),
      benchmark_comparison: {
        portfolio_return_pct: 4.0,
        nifty_return_pct: 2.0,
        bank_fd_return_pct: 1.0,
        alpha_vs_nifty: 2.0,
        alpha_vs_fd: 3.0,
      },
      initial_regime: "BULL_TRENDING",
      current_regime: "BULL_TRENDING",
      risk_persona: "Balanced",
      horizon: "6M",
      created_at: new Date().toISOString(),
      as_of_date: "2026-09-06",
    };

    useAppStore.setState({
      portfolios: [realPortfolio],
      activePortfolioId: "port_to_delete",
    });

    render(<PortfolioPage />);

    expect(screen.queryByText(/This is a demo portfolio/i)).not.toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /Delete Portfolio/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(useAppStore.getState().portfolios.length).toBe(0);
      expect(screen.getByText(/This is a demo portfolio/i)).toBeInTheDocument();
    });

    vi.restoreAllMocks();
  });
});
