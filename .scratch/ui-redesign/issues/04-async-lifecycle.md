# 04: Async Operation Lifecycle — AbortController Registry & Cleanup

**What to build:** A centralized async operation manager that prevents stale data from rendering when users switch tabs or rapidly interact with the app. When a user taps "Generate AI Basket" and then switches to Explore, the in-flight fetch is aborted. When a user clicks Stock A then Stock B rapidly in the profile modal, only Stock B's response renders. The 45-second alert polling interval is properly cleaned up on unmount.

**Blocked by:** 01-react-vite-scaffold

**Status:** resolved

- [x] `useAbortableRequest` custom hook: wraps `fetch()` with an `AbortController`, auto-aborts on component unmount or when a new request with the same key is initiated
- [x] Zustand middleware or store slice for tracking active operation keys (e.g., `basket-generation`, `stock-profile-RELIANCE`, `portfolio-refresh`)
- [x] Tab switch (via React Router navigation) triggers abort of all active controllers
- [x] Stock profile modal: stale-response guard — response handler checks if the requested symbol still matches `AppState.selectedStockSymbol` before rendering
- [x] NitiBot send button: disabled state during await, re-enabled on response or error, with proper AbortController on the chat fetch
- [x] Alert polling interval: stored as a ref, cleared in `useEffect` cleanup
- [x] SSE MarketStreamClient: reconnection logic preserved, properly cleaned up on app unmount
- [x] Test: simulate tab switch during in-flight fetch, verify abort signal fires and no stale DOM update occurs
