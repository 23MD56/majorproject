import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAbortableRequest } from "../../../../src/frontend/hooks/useAbortableRequest";
import { abortRegistry } from "../../../../src/frontend/services/abortRegistry";

describe("useAbortableRequest Hook Seam", () => {
  beforeEach(() => {
    abortRegistry.abortAll();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("executes fetch with registered AbortSignal and returns json data", async () => {
    const mockData = { status: "success", count: 42 };
    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      expect(options.signal).toBeInstanceOf(AbortSignal);
      return Promise.resolve(new Response(JSON.stringify(mockData)));
    });

    const { result } = renderHook(() => useAbortableRequest());

    let data: any;
    await act(async () => {
      data = await result.current.request("test-op", "/api/test");
    });

    expect(data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("automatically aborts in-flight request when component unmounts", async () => {
    let capturedSignal: AbortSignal | undefined;

    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      capturedSignal = options.signal;
      return new Promise(() => {}); // never resolves
    });

    const { result, unmount } = renderHook(() => useAbortableRequest());

    act(() => {
      result.current.request("long-op", "/api/slow").catch(() => {});
    });

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });

  it("automatically aborts previous request when triggering new request under same key", async () => {
    const signals: AbortSignal[] = [];

    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      signals.push(options.signal);
      return new Promise(() => {});
    });

    const { result } = renderHook(() => useAbortableRequest());

    act(() => {
      result.current.request("chat-stream", "/api/chat").catch(() => {});
    });

    act(() => {
      result.current.request("chat-stream", "/api/chat").catch(() => {});
    });

    expect(signals.length).toBe(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it("cleanly suppresses DOMException AbortError without setting component error state", async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          const err = new DOMException("The user aborted a request.", "AbortError");
          reject(err);
        });
      });
    });

    const { result } = renderHook(() => useAbortableRequest());

    let promise: Promise<any>;
    act(() => {
      promise = result.current.request("cancellable", "/api/cancellable");
    });

    act(() => {
      result.current.abort("cancellable");
    });

    await act(async () => {
      const res = await promise;
      expect(res).toBeNull();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
