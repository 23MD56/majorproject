import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../../src/frontend/App";
import { abortRegistry } from "../../../src/frontend/services/abortRegistry";
import { createStaleGuard } from "../../../src/frontend/utils/asyncGuards";
import { useAppStore } from "../../../src/frontend/store/useAppStore";

describe("Async Lifecycle Integration Seam", () => {
  beforeEach(() => {
    abortRegistry.abortAll();
    localStorage.clear();
    localStorage.setItem("quantniti_onboarded", "true");
    useAppStore.setState({ isOnboarded: true, activeTab: "home" });
    window.location.hash = "";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aborts all in-flight requests when switching tabs", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Simulate an in-flight background request on Home tab
    const basketSignal = abortRegistry.register("basket-generation");
    const profileSignal = abortRegistry.register("stock-profile");

    expect(basketSignal.aborted).toBe(false);
    expect(profileSignal.aborted).toBe(false);

    // Click Explore tab
    const exploreTab = screen.getByRole("tab", { name: /explore/i });
    await user.click(exploreTab);

    // Both requests must be aborted on tab change
    expect(basketSignal.aborted).toBe(true);
    expect(profileSignal.aborted).toBe(true);
    expect(abortRegistry.getActiveKeys()).toEqual([]);
  });

  it("stale guard prevents out-of-order response from overwriting newer user selection", async () => {
    let currentSelectedSymbol = "RELIANCE";
    const guard = createStaleGuard(() => currentSelectedSymbol);

    const staleResponseSymbol = "TCS";
    const newerResponseSymbol = "RELIANCE";

    // Stock A (TCS) was requested earlier, but user changed selection to RELIANCE
    const shouldRenderStale = guard.isValid(staleResponseSymbol);
    expect(shouldRenderStale).toBe(false);

    // Stock B (RELIANCE) matches the latest selection
    const shouldRenderNewer = guard.isValid(newerResponseSymbol);
    expect(shouldRenderNewer).toBe(true);
  });

  it("stores active async operation keys in Zustand store", () => {
    const { addActiveAsyncKey, removeActiveAsyncKey } = useAppStore.getState();

    act(() => {
      addActiveAsyncKey("basket-generation");
    });
    expect(useAppStore.getState().activeAsyncKeys.has("basket-generation")).toBe(true);

    act(() => {
      removeActiveAsyncKey("basket-generation");
    });
    expect(useAppStore.getState().activeAsyncKeys.has("basket-generation")).toBe(false);
  });
});
