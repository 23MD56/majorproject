"""Unit tests for NitiBotService and Gemini Integration."""

import os
from unittest.mock import MagicMock, patch
import pytest

from app.core.models import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatStatusResponse,
)
from app.ml.assistant.service import NitiBotService, GeminiClientAdapter


class MockGeminiAdapter:
    """Mock Gemini client adapter for testing without external API calls."""

    def __init__(self, reply_text: str = "This is a mocked NitiBot response."):
        self.reply_text = reply_text
        self.last_prompt = None
        self.last_system_instruction = None

    def generate(self, contents: list, system_instruction: str) -> str:
        self.last_prompt = contents
        self.last_system_instruction = system_instruction
        return self.reply_text


def test_nitibot_service_status_available_when_key_present():
    service = NitiBotService(api_key="mock_key_12345", client_adapter=MockGeminiAdapter())
    status = service.get_status()
    assert status.available is True
    assert status.model == "gemini-2.5-flash"


def test_nitibot_service_status_unavailable_when_key_missing(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    service = NitiBotService(api_key="", client_adapter=None)
    status = service.get_status()
    assert status.available is False
    assert "GEMINI_API_KEY" in (status.message or "")


def test_nitibot_service_chat_successful_response():
    mock_adapter = MockGeminiAdapter(reply_text="Your portfolio is heavily allocated to RELIANCE and TCS.")
    context_builder = MagicMock()
    context_builder.build_context.return_value = MagicMock(
        grounding_text="Current Regime: Bull. RELIANCE: 25%, TCS: 25%.",
        sources=["Market Regime Model", "Portfolio Basket Engine"],
    )

    service = NitiBotService(
        api_key="mock_key_12345",
        client_adapter=mock_adapter,
        context_builder=context_builder,
    )

    request = ChatMessageRequest(
        message="Explain my portfolio allocation",
        session_id="session_abc",
    )

    response = service.chat(request)
    assert isinstance(response, ChatMessageResponse)
    assert response.reply == "Your portfolio is heavily allocated to RELIANCE and TCS."
    assert "Market Regime Model" in response.sources
    assert response.session_id == "session_abc"

    # Verify conversation history was updated
    history = service.memory_manager.get_history("session_abc")
    assert len(history) == 2
    assert history[0].role == "user"
    assert history[1].role == "assistant"


def test_nitibot_service_chat_raises_when_unavailable(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    service = NitiBotService(api_key="", client_adapter=None)
    request = ChatMessageRequest(message="Hello")

    with pytest.raises(RuntimeError) as exc_info:
        service.chat(request)
    assert "GEMINI_API_KEY" in str(exc_info.value) or "unavailable" in str(exc_info.value).lower()


def test_nitibot_service_system_prompt_contains_sebi_disclaimer():
    mock_adapter = MockGeminiAdapter()
    context_builder = MagicMock()
    context_builder.build_context.return_value = MagicMock(
        grounding_text="Grounded Data",
        sources=["QuantNiti Source"],
    )

    service = NitiBotService(
        api_key="mock_key",
        client_adapter=mock_adapter,
        context_builder=context_builder,
    )

    request = ChatMessageRequest(message="What should I buy?")
    service.chat(request)

    assert mock_adapter.last_system_instruction is not None
    assert "SEBI-registered advisor" in mock_adapter.last_system_instruction
    assert "educational assistant" in mock_adapter.last_system_instruction
