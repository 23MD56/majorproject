import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DemoPortfolio } from "../../../src/frontend/components/portfolio/DemoPortfolio";

describe("DemoPortfolio", () => {
  it("renders demo banner, hero card, holdings and navigates on CTA click", () => {
    const handleNavigate = vi.fn();
    render(<DemoPortfolio onNavigateToGrow={handleNavigate} />);

    // Banner verification
    expect(screen.getByText(/This is a demo portfolio/i)).toBeInTheDocument();
    const buildBtns = screen.getAllByRole("button", { name: /Build Your Own/i });
    expect(buildBtns.length).toBeGreaterThan(0);

    fireEvent.click(buildBtns[0]);
    expect(handleNavigate).toHaveBeenCalledOnce();

    // Holdings rendered
    expect(screen.getByText("RELIANCE")).toBeInTheDocument();
    expect(screen.getByText("TCS")).toBeInTheDocument();

    // Compounding chart rendered
    expect(
      screen.getByText(/10-Year Compounding Wealth Trajectory/i)
    ).toBeInTheDocument();
  });
});
