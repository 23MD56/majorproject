import { useEffect, useRef } from "react";

/**
 * Custom hook that runs a periodic polling callback (default 45s for alerts)
 * and guarantees the interval is properly stored as a ref and cleared on unmount.
 */
export function useAlertPolling(
  pollCallback: () => void | Promise<void>,
  intervalMs = 45000,
  enabled = true
) {
  const savedCallback = useRef(pollCallback);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    savedCallback.current = pollCallback;
  }, [pollCallback]);

  useEffect(() => {
    if (!enabled) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Execute immediately on mount/enable
    savedCallback.current();

    // Setup interval
    intervalIdRef.current = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [intervalMs, enabled]);
}
