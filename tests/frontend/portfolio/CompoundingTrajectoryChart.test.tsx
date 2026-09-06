import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CompoundingTrajectoryChart } from "../../../src/frontend/components/portfolio/CompoundingTrajectoryChart";
import { getDemoCompoundingTrajectory } from "../../../src/frontend/components/portfolio/demoPortfolioData";

describe("CompoundingTrajectoryChart", () => {
  it("renders chart title, milestone summaries and alpha tag", () => {
    const trajectory = getDemoCompoundingTrajectory(100000);
    render(<CompoundingTrajectoryChart trajectory={trajectory} isDemo={true} />);

    expect(
      screen.getByText(/10-Year Compounding Wealth Trajectory/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/10Y Alpha vs FD/i)).toBeInTheDocument();
    expect(screen.getByText(/10Y Base Case \(Q50\)/i)).toBeInTheDocument();
    expect(screen.getByText(/10Y 7% Bank FD/i)).toBeInTheDocument();
  });
});
