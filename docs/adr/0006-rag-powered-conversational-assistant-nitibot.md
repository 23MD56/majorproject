# RAG-Powered Conversational Assistant (NitiBot)

We introduce NitiBot, a Retrieval-Augmented Generation (RAG) chatbot that explains QuantNiti's algorithmic decisions in natural language.

## Context

The project review panel asked "Why should I trust this?" and "Can I ask the system questions?" — indicating a need for interactive, explainable AI beyond static Trust Cards. A generic LLM chatbot would add no defensible value; grounding the LLM in QuantNiti's own data via RAG produces verifiable, domain-specific answers.

## Decision

1. **RAG over direct LLM prompting**: NitiBot constructs a context payload from existing services (regime state, portfolio basket, growth projections, Trust Card pillars, backtest results) and injects it into the Gemini prompt. This prevents hallucination and ensures every answer is traceable to real system data.
2. **Google Gemini API (gemini-2.5-flash) on the free tier**: Zero-cost for development and demo (15 RPM, 1M tokens/day). The `google-genai` SDK is added as an optional dependency — the app starts without it.
3. **Graceful degradation**: If `GEMINI_API_KEY` is not set, the chat UI is hidden, the `/api/v1/chat` endpoint returns 503, and all other features remain fully functional. This ensures the panel can evaluate the core platform without API key setup.
4. **SEBI-compliant system prompt**: Hard-coded disclaimer frames NitiBot as an educational tool, not a financial advisor. This is non-negotiable and cannot be overridden by user messages.
5. **Session-scoped memory (10 turns)**: Keeps conversation context manageable without requiring a database. Memory resets on session expiry.

## Consequences

- Adds a single new runtime dependency (`google-genai`) that is optional.
- Adds network latency for chat responses (Gemini API round-trip).
- Chat quality is bounded by the RAG context quality — if existing services return stale data, NitiBot's answers will reflect that.
