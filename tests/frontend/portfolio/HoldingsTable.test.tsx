import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HoldingsTable } from "../../../src/frontend/components/portfolio/HoldingsTable";
import { DEMO_HOLDINGS } from "../../../src/frontend/components/portfolio/demoPortfolioData";

describe("HoldingsTable", () => {
  it("renders all holdings with company symbols, shares, and prices", () => {
    render(<HoldingsTable holdings={DEMO_HOLDINGS} isDemo={true} />);

    expect(screen.getByText("RELIANCE")).toBeInTheDocument();
    expect(screen.getByText("TCS")).toBeInTheDocument();
    expect(screen.getByText("HDFCBANK")).toBeInTheDocument();
    expect(screen.getByText("INFY")).toBeInTheDocument();
    expect(screen.getByText("ICICIBANK")).toBeInTheDocument();
    expect(screen.getByText("LT")).toBeInTheDocument();

    // Table column headers
    expect(screen.getByText(/Asset \/ Sector/i)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Allocation" })).toBeInTheDocument();
    expect(screen.getByText(/LTP \/ 1D/i)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Returns" })).toBeInTheDocument();
  });

  it("renders empty state placeholder when no holdings are passed", () => {
    render(<HoldingsTable holdings={[]} isDemo={false} />);
    expect(screen.getByText(/No holdings in this portfolio yet/i)).toBeInTheDocument();
  });
});
