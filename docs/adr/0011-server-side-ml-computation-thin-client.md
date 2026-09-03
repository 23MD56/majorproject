# Server-Side ML Computation with Thin-Client Mobile Delivery

All quantitative calculations, machine learning inference (GMM regime clustering, multi-factor quantile regressions), and optimization routines (Ledoit-Wolf covariance shrinkage, Hierarchical Risk Parity, discrete integer allocation) execute strictly on the FastAPI server backend. The Android PWA mobile client functions as a high-performance thin presentation tier consuming structured JSON endpoints and Server-Sent Events (SSE).

## Context

The project review panel requested an Android mobile experience tailored for beginners, alongside real-time updates and sophisticated ML under the hood. Running heavy scientific libraries (`scipy`, `numpy`, `scikit-learn`, `cvxpy`) directly inside client-side JavaScript or a mobile WebView causes significant frame drops, high memory overhead, and severe battery drain on mobile devices.

## Considered Options

1. **Client-side ML via WebAssembly / ONNX Runtime Web**: Compiling Python ML models to ONNX/WASM running in the browser. Rejected due to heavy initial bundle size (>40MB), slow startup time on mid-range Android phones, and inability to maintain a single source of truth for backtested historical data.
2. **Hybrid split**: Running factor scoring on the client and covariance optimization on the server. Rejected because it fragments logic and exposes proprietary algorithmic factor weights in client-side code.
3. **Full Server-Side Compute with Thin Client Delivery (chosen)**: FastAPI executes all quantitative operations in $<30\text{ ms}$, serving clean REST responses and 3–5 second SSE ticks. The mobile client focuses entirely on 60fps DOM rendering, Chart.js canvas acceleration, and native touch responsiveness.

## Consequences

- Mobile PWA bundle remains lightweight (<2MB initial payload), ensuring instant loading even on slow 4G Indian mobile networks.
- Model retraining, asset universe adjustments, and data source failovers occur transparently on the server without requiring mobile app updates.
- Enables seamless offline resilience: the client caches the last received portfolio state and regime snapshot using the service worker without needing local ML execution.
