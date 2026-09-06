import { describe, it, expect, beforeEach } from "vitest";
import { abortRegistry } from "../../../../src/frontend/services/abortRegistry";

describe("AbortRegistry Seam", () => {
  beforeEach(() => {
    abortRegistry.abortAll();
  });

  it("registers a key and returns an active AbortSignal", () => {
    const signal = abortRegistry.register("basket-generation");
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
    expect(abortRegistry.has("basket-generation")).toBe(true);
    expect(abortRegistry.getActiveKeys()).toContain("basket-generation");
  });

  it("automatically aborts the prior signal when re-registering the same key", () => {
    const signal1 = abortRegistry.register("stock-profile-RELIANCE");
    expect(signal1.aborted).toBe(false);

    const signal2 = abortRegistry.register("stock-profile-RELIANCE");
    expect(signal1.aborted).toBe(true);
    expect(signal2.aborted).toBe(false);
    expect(abortRegistry.getActiveKeys()).toEqual(["stock-profile-RELIANCE"]);
  });

  it("aborts a specific key when abort(key) is invoked", () => {
    const signal1 = abortRegistry.register("op-1");
    const signal2 = abortRegistry.register("op-2");

    abortRegistry.abort("op-1", "user-cancelled");
    expect(signal1.aborted).toBe(true);
    expect(signal2.aborted).toBe(false);
    expect(abortRegistry.has("op-1")).toBe(false);
    expect(abortRegistry.has("op-2")).toBe(true);
  });

  it("aborts all active signals when abortAll() is invoked", () => {
    const signal1 = abortRegistry.register("op-1");
    const signal2 = abortRegistry.register("op-2");
    const signal3 = abortRegistry.register("op-3");

    abortRegistry.abortAll("tab-switch");

    expect(signal1.aborted).toBe(true);
    expect(signal2.aborted).toBe(true);
    expect(signal3.aborted).toBe(true);
    expect(abortRegistry.getActiveKeys()).toEqual([]);
  });

  it("unregister removes a completed controller without aborting if matching", () => {
    const signal = abortRegistry.register("temp-op");
    abortRegistry.unregister("temp-op");
    expect(abortRegistry.has("temp-op")).toBe(false);
    expect(signal.aborted).toBe(false);
  });
});
