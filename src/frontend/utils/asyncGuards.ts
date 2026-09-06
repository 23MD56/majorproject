/**
 * Guard utilities to prevent race conditions and out-of-order async responses
 * from rendering stale data onto the DOM or into state.
 */

export interface StaleGuard<T> {
  isValid: (responseValue: T) => boolean;
  runIfValid: <R>(responseValue: T, callback: () => R) => R | null;
}

/**
 * Creates a stale-response guard that inspects the current value (via getter)
 * and verifies that the response belongs to the latest state selection.
 */
export function createStaleGuard<T>(getCurrentValue: () => T): StaleGuard<T> {
  return {
    isValid: (responseValue: T) => {
      return responseValue === getCurrentValue();
    },
    runIfValid: <R>(responseValue: T, callback: () => R): R | null => {
      if (responseValue === getCurrentValue()) {
        return callback();
      }
      return null;
    },
  };
}
