import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MarketStreamClient } from "../../../../src/frontend/services/marketStream";

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;
  listeners: Map<string, Function[]> = new Map();
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    const list = this.listeners.get(event);
    if (list) {
      this.listeners.set(
        event,
        list.filter((cb) => cb !== callback)
      );
    }
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => cb({ data: JSON.stringify(data) }));
  }

  close() {
    this.closed = true;
  }
}

describe("MarketStreamClient Service Seam", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource as any);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("connects to SSE endpoint and dispatches tick callbacks", () => {
    const client = new MarketStreamClient("/api/v1/stream/ticks");
    const onTick = vi.fn();
    client.subscribe(onTick);

    client.connect();

    expect(MockEventSource.instances.length).toBe(1);
    const es = MockEventSource.instances[0];

    // Simulate onopen
    es.onopen?.();
    expect(client.isConnected).toBe(true);

    // Simulate tick event
    es.emit("tick", { symbol: "RELIANCE", price: 2950.5 });
    expect(onTick).toHaveBeenCalledWith({ symbol: "RELIANCE", price: 2950.5, prevPrice: undefined, priceDelta: 0 });

    client.disconnect();
  });

  it("handles reconnection with exponential backoff on error", () => {
    const client = new MarketStreamClient("/api/v1/stream/ticks");
    client.connect();

    const es1 = MockEventSource.instances[0];
    expect(es1.closed).toBe(false);

    // Simulate error
    es1.onerror?.(new Error("SSE Network Disconnect"));
    expect(es1.closed).toBe(true);
    expect(client.isConnected).toBe(false);

    // Fast-forward backoff delay (initial is 1000ms)
    vi.advanceTimersByTime(1100);

    expect(MockEventSource.instances.length).toBe(2);
    const es2 = MockEventSource.instances[1];
    expect(es2.closed).toBe(false);

    client.disconnect();
  });

  it("disconnect closes active EventSource and cancels any pending reconnect timers", () => {
    const client = new MarketStreamClient("/api/v1/stream/ticks");
    client.connect();

    const es = MockEventSource.instances[0];
    // Trigger error to set pending reconnect timer
    es.onerror?.(new Error("Network fail"));
    expect(client.isConnected).toBe(false);

    // Immediately disconnect
    client.disconnect();

    // Advance time - should not reconnect
    vi.advanceTimersByTime(10000);
    expect(MockEventSource.instances.length).toBe(1);
  });
});
