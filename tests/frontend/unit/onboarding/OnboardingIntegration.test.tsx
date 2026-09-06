import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../../../src/frontend/App";
import { useAppStore } from "../../../../src/frontend/store/useAppStore";

describe("Onboarding Integration Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    window.location.hash = "";
    useAppStore.setState({
      activeTab: "home",
      theme: "light",
      isOnboarded: false,
      riskPersona: "Balanced",
      horizon: "6M",
    });
  });

  it("first visit shows onboarding hero full-screen and hides header/bottom navigation", async () => {
    render(<App />);

    // Onboarding hero should be rendered
    expect(await screen.findByTestId("onboarding-hero")).toBeInTheDocument();
    expect(screen.getByText(/AI-driven portfolio intelligence for Indian retail investors/i)).toBeInTheDocument();

    // Header brand and bottom navigation tabs should not be present
    expect(screen.queryByRole("tab", { name: /explore/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /portfolio/i })).not.toBeInTheDocument();
  });

  it("completing onboarding transitions smoothly to Home tab and persists results across sessions", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Welcome Splash -> Click Get Started
    const getStartedBtn = await screen.findByRole("button", { name: /get started/i });
    await user.click(getStartedBtn);

    // 2. Quiz Q1: Conservative option
    const q1Option = await screen.findByRole("button", { name: /Exit & preserve cash/i });
    await user.click(q1Option);
    await user.click(screen.getByRole("button", { name: /continue|next/i }));

    // Quiz Q2: Medium horizon
    const q2Option = await screen.findByRole("button", { name: /3 to 6 Months/i });
    await user.click(q2Option);
    await user.click(screen.getByRole("button", { name: /continue|next/i }));

    // Quiz Q3: Capital safety
    const q3Option = await screen.findByRole("button", { name: /Capital Safety/i });
    await user.click(q3Option);
    await user.click(screen.getByRole("button", { name: /see my profile|continue|next/i }));

    // 3. Result Screen
    expect(await screen.findByText(/Conservative Investor/i)).toBeInTheDocument();

    // 4. Click Enter QuantNiti
    const enterBtn = screen.getByRole("button", { name: /enter quantniti/i });
    await user.click(enterBtn);

    // 5. App Shell should now show Home Page and Bottom Navigation
    expect(await screen.findByText(/Home Page/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /explore/i })).toBeInTheDocument();

    // 6. Persisted state verification
    expect(localStorage.getItem("quantniti_onboarded")).toBe("true");
    expect(localStorage.getItem("quantniti_risk_persona")).toBe("Conservative");
    expect(useAppStore.getState().isOnboarded).toBe(true);
    expect(useAppStore.getState().riskPersona).toBe("Conservative");
  }, 15000);

  it("second visit skips onboarding hero entirely and lands directly on Home tab", async () => {
    localStorage.setItem("quantniti_onboarded", "true");
    localStorage.setItem("quantniti_risk_persona", "Aggressive");
    useAppStore.setState({
      isOnboarded: true,
      riskPersona: "Aggressive",
    });

    render(<App />);

    // Should immediately show Home Page
    expect(await screen.findByText(/Home Page/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /home/i })).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-hero")).not.toBeInTheDocument();
  });
});
