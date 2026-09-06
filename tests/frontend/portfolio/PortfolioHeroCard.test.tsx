import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PortfolioHeroCard } from "../../../src/frontend/components/portfolio/PortfolioHeroCard";
import { getDemoPortfolio } from "../../../src/frontend/components/portfolio/demoPortfolioData";

describe("PortfolioHeroCard", () => {
  it("renders demo badge and core metrics in demo mode", () => {
    const demo = getDemoPortfolio();
    render(<PortfolioHeroCard portfolio={demo} isDemo={true} />);

    // Demo badge
    expect(screen.getByText(/DEMO PREVIEW/i)).toBeInTheDocument();

    // Value headers
    expect(screen.getByText(/Current Value/i)).toBeInTheDocument();
    expect(screen.getByText(/1D Returns/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Returns/i)).toBeInTheDocument();

    // Verify alpha tag
    expect(screen.getByText(/Alpha vs NIFTY/i)).toBeInTheDocument();
  });

  it("renders real portfolio data without demo badge when isDemo is false", () => {
    const demo = getDemoPortfolio();
    render(<PortfolioHeroCard portfolio={demo} isDemo={false} />);

    expect(screen.queryByText(/DEMO PREVIEW/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Current Value/i)).toBeInTheDocument();
  });
});
