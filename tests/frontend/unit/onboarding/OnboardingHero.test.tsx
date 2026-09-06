import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingHero } from "../../../../src/frontend/components/onboarding/OnboardingHero";
import { useAppStore } from "../../../../src/frontend/store/useAppStore";

describe("OnboardingHero Component Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      isOnboarded: false,
      riskPersona: "Balanced",
      horizon: "6M",
    });
  });

  it("renders Step 1 Welcome Splash with QuantNiti value prop and 'Get Started' button", () => {
    render(<OnboardingHero />);

    expect(screen.getByText(/QuantNiti/i)).toBeInTheDocument();
    expect(
      screen.getByText(/AI-driven portfolio intelligence for Indian retail investors/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /get started/i })
    ).toBeInTheDocument();
  });

  it("advances from Step 1 to Step 2 (Persona Quiz) when clicking 'Get Started'", async () => {
    const user = userEvent.setup();
    render(<OnboardingHero />);

    const getStartedBtn = screen.getByRole("button", { name: /get started/i });
    await user.click(getStartedBtn);

    // Q1 prompt should be visible
    expect(
      await screen.findByText(/Your stocks dropped 15% in a week/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Scenario 1/i)).toBeInTheDocument();
  });

  it("navigates through all 3 quiz questions using large tappable cards", async () => {
    const user = userEvent.setup();
    render(<OnboardingHero />);

    // Step 1 -> Step 2
    await user.click(screen.getByRole("button", { name: /get started/i }));

    // Question 1
    expect(await screen.findByText(/Your stocks dropped 15% in a week/i)).toBeInTheDocument();
    const q1Option = screen.getByRole("button", { name: /Exit & preserve cash/i });
    await user.click(q1Option);

    const nextBtn1 = screen.getByRole("button", { name: /continue|next/i });
    await user.click(nextBtn1);

    // Question 2
    expect(await screen.findByText(/How long can you leave your money invested/i)).toBeInTheDocument();
    const q2Option = screen.getByRole("button", { name: /1 to 3 Months/i });
    await user.click(q2Option);

    const nextBtn2 = screen.getByRole("button", { name: /continue|next/i });
    await user.click(nextBtn2);

    // Question 3
    expect(await screen.findByText(/What matters more to you/i)).toBeInTheDocument();
    const q3Option = screen.getByRole("button", { name: /Capital Safety/i });
    await user.click(q3Option);

    const finishBtn = screen.getByRole("button", { name: /see my profile|continue|next/i });
    await user.click(finishBtn);

    // Step 3 Result Screen
    expect(await screen.findByText(/Conservative Investor/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter quantniti/i })).toBeInTheDocument();
  });

  it("stores results in Zustand and localStorage and fires onComplete upon clicking 'Enter QuantNiti'", async () => {
    const user = userEvent.setup();
    const onCompleteMock = vi.fn();

    render(<OnboardingHero onComplete={onCompleteMock} />);

    // Start
    await user.click(screen.getByRole("button", { name: /get started/i }));

    // Q1: Buy dip
    const q1Buy = await screen.findByRole("button", { name: /Buy the dip aggressively/i });
    await user.click(q1Buy);
    await user.click(screen.getByRole("button", { name: /continue|next/i }));

    // Q2: 1 Year or longer
    const q2Long = await screen.findByRole("button", { name: /1 Year or Longer/i });
    await user.click(q2Long);
    await user.click(screen.getByRole("button", { name: /continue|next/i }));

    // Q3: Risk-Adjusted Returns
    const q3Returns = await screen.findByRole("button", { name: /Risk-Adjusted Returns/i });
    await user.click(q3Returns);
    await user.click(screen.getByRole("button", { name: /see my profile|continue|next/i }));

    // Result shows Aggressive Investor
    expect(await screen.findByText(/Aggressive Investor/i)).toBeInTheDocument();

    // Click Enter QuantNiti
    const enterBtn = screen.getByRole("button", { name: /enter quantniti/i });
    await user.click(enterBtn);

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    expect(onCompleteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        riskPersona: "Aggressive",
        horizon: "12M",
      })
    );

    // Verify Zustand state
    const state = useAppStore.getState();
    expect(state.isOnboarded).toBe(true);
    expect(state.riskPersona).toBe("Aggressive");
    expect(state.horizon).toBe("12M");

    // Verify localStorage
    expect(localStorage.getItem("quantniti_onboarded")).toBe("true");
    expect(localStorage.getItem("quantniti_risk_persona")).toBe("Aggressive");
  });
});
