"""Unit tests for NitiBot Session Conversation Memory Manager."""

import time
import pytest
from app.ml.assistant.memory import ConversationMemoryManager, MessageTurn


def test_memory_manager_add_and_retrieve_turns():
    memory = ConversationMemoryManager(max_turns=10, ttl_seconds=3600)
    session_id = "test_session_1"

    # Add 3 message turns
    memory.add_user_message(session_id, "Hello, what is my portfolio allocation?")
    memory.add_assistant_message(session_id, "Your portfolio is 25% Reliance and 25% TCS.")

    memory.add_user_message(session_id, "What is the market regime?")
    memory.add_assistant_message(session_id, "The market is in Low-Volatility Bull.")

    history = memory.get_history(session_id)
    assert len(history) == 4
    assert history[0].role == "user"
    assert "allocation" in history[0].content
    assert history[1].role == "assistant"
    assert "Reliance" in history[1].content


def test_memory_manager_sliding_window_limit():
    memory = ConversationMemoryManager(max_turns=3, ttl_seconds=3600)
    session_id = "test_session_2"

    # Add 5 turns (10 messages)
    for i in range(1, 6):
        memory.add_user_message(session_id, f"User message {i}")
        memory.add_assistant_message(session_id, f"Assistant reply {i}")

    history = memory.get_history(session_id)
    # Sliding window of max_turns=3 should keep the last 3 turns = 6 messages
    assert len(history) == 6
    assert history[0].content == "User message 3"
    assert history[-1].content == "Assistant reply 5"


def test_memory_manager_clear_session():
    memory = ConversationMemoryManager(max_turns=10, ttl_seconds=3600)
    session_id = "test_session_3"

    memory.add_user_message(session_id, "Question 1")
    memory.add_assistant_message(session_id, "Reply 1")

    assert len(memory.get_history(session_id)) == 2
    memory.clear_session(session_id)
    assert len(memory.get_history(session_id)) == 0


def test_memory_manager_format_for_gemini():
    memory = ConversationMemoryManager(max_turns=10, ttl_seconds=3600)
    session_id = "test_session_4"

    memory.add_user_message(session_id, "How risky is my portfolio?")
    memory.add_assistant_message(session_id, "Max stress drawdown is 8.4%.")

    formatted = memory.get_formatted_history(session_id)
    assert len(formatted) == 2
    assert formatted[0]["role"] == "user"
    assert formatted[1]["role"] == "model"
