import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter } from "react-router-dom";
import { BottomNav } from "../../../src/frontend/components/layout/BottomNav";

function renderBottomNav(currentTab = "home") {
  return render(
    <HashRouter>
      <BottomNav activeTab={currentTab} />
    </HashRouter>
  );
}

describe("BottomNav Component Seam", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 4 tab buttons: Home, Explore, Grow, Portfolio with accessible labels", () => {
    renderBottomNav("home");

    expect(screen.getByRole("tab", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /explore/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /grow/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /portfolio/i })).toBeInTheDocument();
  });

  it("highlights active tab with aria-selected true and renders active pill indicator", () => {
    renderBottomNav("grow");

    const growTab = screen.getByRole("tab", { name: /grow/i });
    expect(growTab).toHaveAttribute("aria-selected", "true");

    const homeTab = screen.getByRole("tab", { name: /home/i });
    expect(homeTab).toHaveAttribute("aria-selected", "false");

    const activePill = screen.getByTestId("active-tab-indicator");
    expect(activePill).toBeInTheDocument();
  });

  it("triggers haptic feedback via navigator.vibrate(12) on tab click when supported", async () => {
    const user = userEvent.setup();
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    renderBottomNav("home");

    const exploreTab = screen.getByRole("tab", { name: /explore/i });
    await user.click(exploreTab);

    expect(vibrateMock).toHaveBeenCalledWith(12);
  });
});
