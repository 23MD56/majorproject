"""Unit tests for NitiBot RAG grounding with Financial Literacy Microlearning Cards."""

from app.ml.assistant.context_builder import RAGContextBuilder


def test_rag_context_builder_includes_literacy_card_when_query_matches():
    builder = RAGContextBuilder()
    
    # Query about HRP and cricket analogy
    user_ctx = {"query": "Can you explain HRP diversification like a cricket team?"}
    payload = builder.build_context(user_context=user_ctx)
    
    assert "Financial Literacy Knowledge Base" in payload.sources
    assert "Hierarchical Risk Parity" in payload.grounding_text
    assert "cricket" in payload.grounding_text.lower()


def test_rag_context_builder_includes_concept_key_explicitly():
    builder = RAGContextBuilder()
    
    user_ctx = {"concept_key": "sharpe_ratio"}
    payload = builder.build_context(user_context=user_ctx)
    
    assert "Financial Literacy Knowledge Base" in payload.sources
    assert "Sharpe Ratio" in payload.grounding_text
    assert "analogy" in payload.grounding_text.lower() or "fuel efficiency" in payload.grounding_text.lower()


def test_rag_context_builder_ignores_when_no_match():
    builder = RAGContextBuilder()
    user_ctx = {"query": "Hello there, just checking the time"}
    payload = builder.build_context(user_context=user_ctx)
    
    # Should not include literacy section if not relevant
    assert "Financial Literacy Microlearning Concept" not in payload.grounding_text
