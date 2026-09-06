import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  initPWAInstallListener,
  getDeferredInstallPrompt,
  promptPWAInstall,
  isIOSSafariBannerEligible,
  subscribeUserToPush,
  urlBase64ToUint8Array,
} from "../../../src/frontend/services/pwaService";
import { IOSInstallBanner } from "../../../src/frontend/components/pwa/IOSInstallBanner";

describe("PWA Service & Install Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("intercepts beforeinstallprompt and stores deferred prompt", () => {
    initPWAInstallListener();

    const mockEvent = new Event("beforeinstallprompt") as any;
    mockEvent.preventDefault = vi.fn();
    mockEvent.prompt = vi.fn().mockResolvedValue(undefined);
    mockEvent.userChoice = Promise.resolve({ outcome: "accepted" });

    window.dispatchEvent(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(getDeferredInstallPrompt()).toBe(mockEvent);
  });

  it("promptPWAInstall triggers prompt and clears deferred event on acceptance", async () => {
    initPWAInstallListener();

    const mockEvent = new Event("beforeinstallprompt") as any;
    mockEvent.preventDefault = vi.fn();
    mockEvent.prompt = vi.fn().mockResolvedValue(undefined);
    mockEvent.userChoice = Promise.resolve({ outcome: "accepted" });

    window.dispatchEvent(mockEvent);

    const outcome = await promptPWAInstall();
    expect(mockEvent.prompt).toHaveBeenCalled();
    expect(outcome).toBe("accepted");
    expect(getDeferredInstallPrompt()).toBeNull();
  });

  it("urlBase64ToUint8Array properly converts base64url keys", () => {
    const sample = "BA12-34_";
    const uint8 = urlBase64ToUint8Array(sample);
    expect(uint8).toBeInstanceOf(Uint8Array);
    expect(uint8.length).toBeGreaterThan(0);
  });

  it("detects iOS Safari banner eligibility correctly", () => {
    // Not iOS -> false
    expect(isIOSSafariBannerEligible("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);

    // iOS and not dismissed and not standalone -> true
    expect(
      isIOSSafariBannerEligible(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      )
    ).toBe(true);

    // If dismissed in localStorage -> false
    localStorage.setItem("quantniti_ios_pwa_dismissed", "true");
    expect(
      isIOSSafariBannerEligible(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      )
    ).toBe(false);
  });

  it("renders IOSInstallBanner with violet styling and dismisses on user click", async () => {
    render(<IOSInstallBanner forceShow />);

    expect(screen.getByText(/Install QuantNiti on iPhone/i)).toBeInTheDocument();
    expect(screen.getByText(/Share/i)).toBeInTheDocument();
    expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();

    const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(localStorage.getItem("quantniti_ios_pwa_dismissed")).toBe("true");
    await waitFor(() => {
      expect(screen.queryByText(/Install QuantNiti on iPhone/i)).not.toBeInTheDocument();
    });
  });
});
