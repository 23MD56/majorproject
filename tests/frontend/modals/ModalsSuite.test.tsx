import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { WriteReviewModal } from "../../../src/frontend/components/modals/WriteReviewModal";
import { ConceptDetailModal } from "../../../src/frontend/components/modals/ConceptDetailModal";
import { CompetitorBenchmarkModal } from "../../../src/frontend/components/modals/CompetitorBenchmarkModal";
import { OrderSheetModal } from "../../../src/frontend/components/modals/OrderSheetModal";
import { PortfolioReportCard } from "../../../src/frontend/components/modals/PortfolioReportCard";
import { ModalRoot } from "../../../src/frontend/components/modals/ModalRoot";
import { useAppStore } from "../../../src/frontend/store/useAppStore";
import { getDemoPortfolio } from "../../../src/frontend/components/portfolio/demoPortfolioData";

describe("Modals and Overlays Suite", () => {
  beforeEach(() => {
    useAppStore.setState({
      activeModal: null,
      modalPayload: null,
      learnedConcepts: new Set(),
      portfolios: [],
    });
  });

  it("WriteReviewModal renders star selector, claimed return input, and AI verification badge", async () => {
    const handleSuccess = vi.fn();
    render(
      <WriteReviewModal
        isOpen={true}
        onClose={() => {}}
        targetType="basket"
        targetId="test_basket"
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText("Write a Verified Review")).toBeInTheDocument();
    expect(screen.getByText("3-Tier AI Fact-Checking Active")).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/Arun M/i);
    const headlineInput = screen.getByPlaceholderText(/Great transparency/i);
    const commentInput = screen.getByPlaceholderText(/Describe execution/i);

    fireEvent.change(nameInput, { target: { value: "Trader Test" } });
    fireEvent.change(headlineInput, { target: { value: "Super solid regime transitions" } });
    fireEvent.change(commentInput, { target: { value: "Drawdown remained within 4% throughout the quarter." } });

    const submitBtn = screen.getByRole("button", { name: /Submit Verified Review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Review Verified/i)).toBeInTheDocument();
    });
  });

  it("ConceptDetailModal renders plain-English definition, analogy, formula, and updates learned toggle", () => {
    const concept = {
      key: "sharpe_ratio",
      title: "Sharpe Ratio",
      category: "Risk",
      explanation: "Measures excess return earned per unit of total risk taken.",
      analogy: "Like miles per gallon for investment returns — how much performance you get per unit of risk fuel consumed.",
      formula: "Sharpe = (Portfolio Return - Risk Free Rate) / Annual Volatility",
    };

    render(<ConceptDetailModal isOpen={true} onClose={() => {}} concept={concept} />);

    expect(screen.getByText("Sharpe Ratio")).toBeInTheDocument();
    expect(screen.getByText(/Measures excess return/i)).toBeInTheDocument();
    expect(screen.getByText(/Like miles per gallon/i)).toBeInTheDocument();
    expect(screen.getByText(/Sharpe = /i)).toBeInTheDocument();

    const toggleBtn = screen.getByRole("button", { name: /Mark as Learned/i });
    fireEvent.click(toggleBtn);

    expect(useAppStore.getState().learnedConcepts.has("sharpe_ratio")).toBe(true);
    expect(screen.getByText(/Marked as Learned/i)).toBeInTheDocument();
  });

  it("CompetitorBenchmarkModal renders comparison matrix and computes fee drag", () => {
    render(<CompetitorBenchmarkModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText("QuantNiti vs Competitors")).toBeInTheDocument();
    expect(screen.getByText("Dynamic Regime Adaptation")).toBeInTheDocument();
    expect(screen.getByText("Broker-Agnostic 1-Click Order Sheet")).toBeInTheDocument();

    // Fee drag calculator
    expect(screen.getByText(/10-Year Mutual Fund Fee Drag Calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Wealth Siphoned by Fund Fees/i)).toBeInTheDocument();
  });

  it("OrderSheetModal renders Groww text and Zerodha CSV instructions with copy support", () => {
    const portfolio = getDemoPortfolio();
    render(<OrderSheetModal isOpen={true} onClose={() => {}} portfolio={portfolio} />);

    expect(screen.getByText("1-Click Broker Order Sheet")).toBeInTheDocument();
    expect(screen.getByText(/BUY RELIANCE/i)).toBeInTheDocument();

    // Switch to Zerodha Basket CSV
    const zerodhaTab = screen.getByRole("button", { name: /Zerodha Basket CSV/i });
    fireEvent.click(zerodhaTab);

    expect(screen.getByText(/Instrument,Action,Quantity/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download .CSV File/i })).toBeInTheDocument();
  });

  it("PortfolioReportCard renders printable certified audit sheet", () => {
    const portfolio = getDemoPortfolio();
    render(<PortfolioReportCard isOpen={true} onClose={() => {}} portfolio={portfolio} />);

    expect(screen.getByText("QuantNiti Portfolio Audit Card")).toBeInTheDocument();
    expect(screen.getByText("Certified Strategy")).toBeInTheDocument();
    expect(screen.getByText("Algorithmic Trust & Audit Attestation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Print or Save PDF Report Card/i })).toBeInTheDocument();
  });

  it("ModalRoot dismisses modal on Android back button (popstate) event", () => {
    useAppStore.getState().openModal("competitors");
    render(<ModalRoot />);

    expect(screen.getByText("QuantNiti vs Competitors")).toBeInTheDocument();

    // Simulate browser/Android back gesture
    fireEvent(window, new PopStateEvent("popstate", { state: null }));

    expect(useAppStore.getState().activeModal).toBeNull();
  });
});
