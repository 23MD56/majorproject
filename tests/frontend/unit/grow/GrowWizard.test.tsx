import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Step1Capital } from "../../../../src/frontend/components/grow/Step1Capital";
import { Step2Horizon } from "../../../../src/frontend/components/grow/Step2Horizon";
import { Step3Persona } from "../../../../src/frontend/components/grow/Step3Persona";
import { SummaryPills } from "../../../../src/frontend/components/grow/SummaryPills";

describe("Grow Wizard Subcomponents Seam", () => {
  describe("Step1Capital", () => {
    it("renders capital amount, word form reassurance, slider, and quick-pick chips", async () => {
      const onCapitalChange = vi.fn();
      const onNext = vi.fn();
      const user = userEvent.setup();

      render(
        <Step1Capital
          capital={50000}
          onCapitalChange={onCapitalChange}
          onNext={onNext}
        />
      );

      expect(screen.getByText("₹50,000")).toBeInTheDocument();
      expect(screen.getByText("Fifty Thousand Only")).toBeInTheDocument();
      expect(screen.getByText(/Safe simulated capital • No live trading/i)).toBeInTheDocument();

      // Quick-pick chips
      const chip10k = screen.getByRole("button", { name: /₹10k/i });
      const chip1L = screen.getByRole("button", { name: /₹1L/i });
      expect(chip10k).toBeInTheDocument();
      expect(chip1L).toBeInTheDocument();

      await user.click(chip10k);
      expect(onCapitalChange).toHaveBeenCalledWith(10000);

      // Continue button
      const continueBtn = screen.getByRole("button", { name: /continue|next/i });
      await user.click(continueBtn);
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Step2Horizon", () => {
    it("renders 2x2 grid of horizon cards with recommended badge on 6M", async () => {
      const onHorizonChange = vi.fn();
      const onNext = vi.fn();
      const onBack = vi.fn();
      const user = userEvent.setup();

      render(
        <Step2Horizon
          horizon="6M"
          onHorizonChange={onHorizonChange}
          onNext={onNext}
          onBack={onBack}
        />
      );

      expect(screen.getByText(/6 Months/i)).toBeInTheDocument();
      expect(screen.getByText(/Recommended/i)).toBeInTheDocument();
      expect(screen.getByText(/1 Month/i)).toBeInTheDocument();
      expect(screen.getByText(/12 Months/i)).toBeInTheDocument();

      // Select 12M
      const card12M = screen.getByRole("button", { name: /12 Months/i });
      await user.click(card12M);
      expect(onHorizonChange).toHaveBeenCalledWith("12M");

      // Back & Next
      await user.click(screen.getByRole("button", { name: /back/i }));
      expect(onBack).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole("button", { name: /continue|next/i }));
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Step3Persona", () => {
    it("renders 4 vertical persona cards with drawdown guardrails and plain-language descriptions", async () => {
      const onPersonaChange = vi.fn();
      const onNext = vi.fn();
      const onBack = vi.fn();
      const user = userEvent.setup();

      render(
        <Step3Persona
          riskPersona="Balanced"
          onPersonaChange={onPersonaChange}
          onNext={onNext}
          onBack={onBack}
        />
      );

      expect(screen.getByText("Conservative")).toBeInTheDocument();
      expect(screen.getByText("Balanced")).toBeInTheDocument();
      expect(screen.getByText("Aggressive")).toBeInTheDocument();
      expect(screen.getByText("ESG-Conscious")).toBeInTheDocument();

      // Drawdown guardrails
      expect(screen.getByText(/8–12% Max Drawdown/i)).toBeInTheDocument();

      // Select Aggressive
      const aggressiveCard = screen.getByRole("button", { name: /Aggressive/i });
      await user.click(aggressiveCard);
      expect(onPersonaChange).toHaveBeenCalledWith("Aggressive");

      await user.click(screen.getByRole("button", { name: /continue|review|generate/i }));
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("SummaryPills", () => {
    it("renders summary pills for completed steps and triggers onEditStep", async () => {
      const onEditStep = vi.fn();
      const user = userEvent.setup();

      render(
        <SummaryPills
          currentStep={3}
          capital={50000}
          horizon="6M"
          riskPersona="Balanced"
          onEditStep={onEditStep}
        />
      );

      expect(
        screen.getByRole("button", { name: /Capital: ₹50,000/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Horizon: 6M/i })
      ).toBeInTheDocument();

      // Click Edit on Capital
      const editCapital = screen.getByRole("button", { name: /Capital: ₹50,000/i });
      await user.click(editCapital);
      expect(onEditStep).toHaveBeenCalledWith(1);
    });
  });
});
