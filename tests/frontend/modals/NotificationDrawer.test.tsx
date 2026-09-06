import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotificationDrawer } from "../../../src/frontend/components/modals/NotificationDrawer";

describe("NotificationDrawer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders notification items, category filters, and web push prompt", () => {
    render(<NotificationDrawer isOpen={true} onClose={() => {}} />);

    expect(screen.getByText("Smart Notifications")).toBeInTheDocument();
    expect(screen.getByText("Enable Web Push Alerts")).toBeInTheDocument();
    expect(screen.getByText("Market Regime Active: Bull Market")).toBeInTheDocument();
    expect(screen.getByText("Asset Allocation Drift Notice")).toBeInTheDocument();
  });

  it("filters notifications by category pill", () => {
    render(<NotificationDrawer isOpen={true} onClose={() => {}} />);

    const driftBtn = screen.getByRole("button", { name: "Drift" });
    fireEvent.click(driftBtn);

    expect(screen.getByText("Asset Allocation Drift Notice")).toBeInTheDocument();
    expect(screen.queryByText("Market Regime Active: Bull Market")).not.toBeInTheDocument();
  });

  it("sets up and tears down 45-second polling interval on open/unmount", () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");

    const { unmount } = render(<NotificationDrawer isOpen={true} onClose={() => {}} />);

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 45000);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
