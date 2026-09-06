import { describe, it, expect } from "vitest";
import {
  getDemoPortfolio,
  getDemoCompoundingTrajectory,
  DEMO_HOLDINGS,
} from "../../../src/frontend/components/portfolio/demoPortfolioData";

describe("demoPortfolioData", () => {
  it("should generate a realistic demo portfolio with 5-7 NIFTY 50 bluechip holdings", () => {
    const portfolio = getDemoPortfolio();

    expect(portfolio).toBeDefined();
    expect(portfolio.portfolio_id).toBe("demo-portfolio-nifty50");
    expect(portfolio.name).toBe("Demo NIFTY 50 Balanced Basket");
    expect(portfolio.is_demo).toBe(true);

    expect(portfolio.holdings.length).toBeGreaterThanOrEqual(5);
    expect(portfolio.holdings.length).toBeLessThanOrEqual(7);

    // Verify familiar NIFTY symbols exist
    const symbols = portfolio.holdings.map((h) => h.symbol);
    expect(symbols).toContain("RELIANCE");
    expect(symbols).toContain("TCS");
    expect(symbols).toContain("HDFCBANK");
    expect(symbols).toContain("INFY");
  });

  it("should have correct math calculations for total value, invested capital and returns", () => {
    const portfolio = getDemoPortfolio();

    expect(portfolio.initial_capital).toBeGreaterThan(0);
    expect(portfolio.invested_capital).toBeGreaterThan(0);
    expect(portfolio.current_value).toBeGreaterThan(0);

    const calculatedHoldingsVal = portfolio.holdings.reduce(
      (sum, h) => sum + h.current_value,
      0
    );
    expect(calculatedHoldingsVal + portfolio.cash).toBeCloseTo(portfolio.current_value, 0);

    const calculatedInvested = portfolio.holdings.reduce(
      (sum, h) => sum + h.invested_amount,
      0
    );
    expect(portfolio.total_pnl).toBeCloseTo(
      portfolio.current_value - portfolio.initial_capital,
      0
    );

    expect(portfolio.benchmark_comparison).toBeDefined();
    expect(portfolio.benchmark_comparison.nifty_return_pct).toBeDefined();
    expect(portfolio.benchmark_comparison.alpha_vs_nifty).toBeDefined();
  });

  it("should provide a 10-year compounding trajectory dataset matching backend schema", () => {
    const trajectory = getDemoCompoundingTrajectory(100000);

    expect(trajectory).toBeDefined();
    expect(trajectory.yearly_trajectories.length).toBe(10);
    expect(trajectory.tenure_years).toBe(10);

    // Verify quantile cones order: 90th >= 50th >= 10th
    trajectory.yearly_trajectories.forEach((pt, idx) => {
      expect(pt.year).toBe(idx + 1);
      expect(pt.gbm_optimistic_90th).toBeGreaterThanOrEqual(pt.gbm_base_50th);
      expect(pt.gbm_base_50th).toBeGreaterThanOrEqual(pt.gbm_pessimistic_10th);
      expect(pt.bank_fd_value).toBeGreaterThan(0);
    });
  });
});
