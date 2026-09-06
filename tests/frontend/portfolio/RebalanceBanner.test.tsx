import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RebalanceBanner } from "../../../src/frontend/components/portfolio/RebalanceBanner";

describe("RebalanceBanner", () => {
  it("renders when isRebalanceRecommended is true and calls onApplyRebalance on click", () => {
    const handleApply = vi.fn();
    render(
      <RebalanceBanner
        portfolioId="p1"
        isRebalanceRecommended={true}
        triggerReason="Regime shifted from BULL to VOLATILE"
        onApplyRebalance={handleApply}
      />
    );

    expect(screen.getByText(/Regime-Shift Rebalance Recommended/i)).toBeInTheDocument();
    expect(screen.getByText(/Regime shifted from BULL to VOLATILE/i)).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /Apply Rebalance/i });
    fireEvent.click(button);
    expect(handleApply).toHaveBeenCalledOnce();
  });

  it("does not render when isRebalanceRecommended is false", () => {
    const { container } = render(
      <RebalanceBanner
        portfolioId="p1"
        isRebalanceRecommended={false}
        onApplyRebalance={() => {}}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
