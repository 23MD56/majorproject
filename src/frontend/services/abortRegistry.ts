/**
 * Centralized AbortController registry for tracking and managing in-flight async operations.
 * Prevents race conditions and guarantees stale requests are aborted across tabs or repeated user interactions.
 */
export class AbortRegistry {
  private controllers: Map<string, AbortController> = new Map();

  /**
   * Register an async operation key. If an operation already exists under this key,
   * its previous AbortController is aborted immediately before creating a new one.
   */
  register(key: string): AbortSignal {
    const existing = this.controllers.get(key);
    if (existing) {
      try {
        existing.abort(`superseded-by-${key}`);
      } catch {
        // No-op for environments where abort() doesn't accept reason
      }
    }

    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller.signal;
  }

  /**
   * Abort a specific operation by key and remove it from the registry.
   */
  abort(key: string, reason?: string): void {
    const controller = this.controllers.get(key);
    if (controller) {
      try {
        controller.abort(reason || "aborted");
      } catch {
        // Fallback for older abort implementations
      }
      this.controllers.delete(key);
    }
  }

  /**
   * Abort all currently registered in-flight operations.
   */
  abortAll(reason?: string): void {
    for (const controller of this.controllers.values()) {
      try {
        controller.abort(reason || "aborted-all");
      } catch {
        // Fallback
      }
    }
    this.controllers.clear();
  }

  /**
   * Unregister an operation key without aborting it, typically called upon successful completion.
   */
  unregister(key: string, controller?: AbortController): void {
    const existing = this.controllers.get(key);
    if (!controller || existing === controller) {
      this.controllers.delete(key);
    }
  }

  /**
   * Check if an active controller exists for the given key.
   */
  has(key: string): boolean {
    return this.controllers.has(key);
  }

  /**
   * Return a list of all active operation keys.
   */
  getActiveKeys(): string[] {
    return Array.from(this.controllers.keys());
  }
}

export const abortRegistry = new AbortRegistry();
