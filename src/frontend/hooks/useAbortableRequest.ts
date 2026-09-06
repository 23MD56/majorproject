import { useState, useRef, useEffect, useCallback } from "react";
import { abortRegistry } from "../services/abortRegistry";
import { useAppStore } from "../store/useAppStore";

export interface AbortableRequestOptions extends RequestInit {
  parseJson?: boolean;
}

export function useAbortableRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const activeKeysRef = useRef<Set<string>>(new Set());

  const addActiveKey = useAppStore((state) => state.addActiveAsyncKey);
  const removeActiveKey = useAppStore((state) => state.removeActiveAsyncKey);

  // Auto-abort all requests initiated by this component instance upon unmount
  useEffect(() => {
    const keys = activeKeysRef.current;
    return () => {
      for (const key of keys) {
        abortRegistry.abort(key, "component-unmounted");
        removeActiveKey?.(key);
      }
      keys.clear();
    };
  }, [removeActiveKey]);

  const abort = useCallback(
    (key: string, reason?: string) => {
      abortRegistry.abort(key, reason);
      activeKeysRef.current.delete(key);
      removeActiveKey?.(key);
      setIsLoading(false);
    },
    [removeActiveKey]
  );

  const request = useCallback(
    async <T = any>(
      key: string,
      input: RequestInfo | URL,
      options: AbortableRequestOptions = {}
    ): Promise<T | null> => {
      const { parseJson = true, ...fetchOptions } = options;

      const signal = abortRegistry.register(key);
      activeKeysRef.current.add(key);
      addActiveKey?.(key);

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(input, {
          ...fetchOptions,
          signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = parseJson ? await response.json() : await response.text();
        return data as T;
      } catch (err: any) {
        // Cleanly suppress AbortError without bubbling user-facing errors
        if (err?.name === "AbortError" || signal.aborted) {
          return null;
        }

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        abortRegistry.unregister(key);
        activeKeysRef.current.delete(key);
        removeActiveKey?.(key);
        setIsLoading(false);
      }
    },
    [addActiveKey, removeActiveKey]
  );

  return {
    request,
    abort,
    isLoading,
    error,
  };
}
