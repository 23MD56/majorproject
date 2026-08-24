# 12: NitiBot — RAG-Powered Portfolio Intelligence Assistant

**What to build:** A context-aware conversational AI assistant embedded in the QuantNiti UI that answers natural-language questions about the user's portfolio recommendations, market regime, growth projections, and backtest results. NitiBot retrieves real data from QuantNiti's own services (Retrieval-Augmented Generation) and forwards an augmented prompt to the Google Gemini API, returning data-grounded, explainable answers — not generic financial advice. The feature degrades gracefully: if no `GEMINI_API_KEY` environment variable is set, the chat interface is hidden and all other features remain fully functional.

**Blocked by:** 04: AI Portfolio Basket Engine & Trust Card, 07: Unified Mobile-First Client Shell & End-to-End Integration

**Status:** complete

- [x] Adds `POST /api/v1/chat` endpoint accepting `{ "message": str, "context": optional dict }` and returning `{ "reply": str, "sources": list[str] }`.
- [x] Implements RAG context builder service that aggregates: (1) current market regime state and probabilities, (2) active portfolio basket weights and stock names, (3) growth projection quantiles for basket stocks, (4) Trust Card pillars (regime context, hit rate, max drawdown, fee savings), (5) most recent backtest summary if available.
- [x] Integrates Google Gemini API (`google-genai` SDK, model `gemini-2.5-flash`) with a hard-coded system prompt that includes: domain glossary from CONTEXT.md, SEBI-compliant disclaimer ("You are an educational assistant. You do not provide personalized financial advice. For investment decisions, consult a SEBI-registered advisor."), and instructions to reference only the provided RAG context.
- [x] Implements session-scoped conversation memory (last 10 message turns) stored in server-side session state, cleared on session expiry.
- [x] Adds `google-genai` as an optional dependency in `pyproject.toml` (the app must start and run without it installed).
- [x] Implements graceful degradation: on startup, checks for `GEMINI_API_KEY` env var; if absent, the `/api/v1/chat` endpoint returns `503 Service Unavailable` with a descriptive message, and the frontend hides the chat UI entirely.
- [x] Builds floating chat bubble UI (bottom-right, above tab bar on mobile, above sidebar on desktop): tapping opens a slide-up glassmorphism chat panel with message history, input field, and send button.
- [x] Renders 3 suggested quick-action prompt chips above the input field: "Explain my portfolio", "What if the market crashes?", "Why this stock?"
- [x] Displays a typing indicator while awaiting the Gemini API response.
- [x] Chat panel includes a visible disclaimer footer: "NitiBot is an educational tool, not a financial advisor."
- [x] Passes automated unit tests: RAG context builder constructs correct payload shape, chat endpoint returns valid response structure with mocked Gemini responses, graceful degradation returns 503 when key is absent.

