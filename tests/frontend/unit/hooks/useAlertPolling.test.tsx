import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAlertPolling } from "../../../../src/frontend/hooks/useAlertPolling";

describe("useAlertPolling Hook Seam", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("calls pollCallback immediately on mount and every 45 seconds thereafter", () => {
    const pollCallback = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useAlertPolling(pollCallback, 45000));

    expect(pollCallback).toHaveBeenCalledTimes(1);

    // Advance 45s
    vi.advanceTimersByTime(45000);
    expect(pollCallback).toHaveBeenCalledTimes(2);

    // Advance another 45s
    vi.advanceTimersByTime(45000);
    expect(pollCallback).toHaveBeenCalledTimes(3);
  });

  it("cleans up interval on unmount so no further poll callbacks occur", () => {
    const pollCallback = vi.fn().mockResolvedValue(undefined);

    const { unmount } = renderHook(() => useAlertPolling(pollCallback, 45000));
    expect(pollCallback).toHaveBeenCalledTimes(1);

    unmount();

    vi.advanceTimersByTime(90000);
    expect(pollCallback).toHaveBeenCalledTimes(1); // No more calls
  });
});
