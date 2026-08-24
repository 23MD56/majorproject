"""Session-scoped conversation memory for NitiBot."""

import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class MessageTurn:
    role: str  # "user" or "assistant"
    content: str
    timestamp: float = field(default_factory=time.time)


class ConversationMemoryManager:
    """Manages session-scoped conversation history with sliding window and TTL."""

    def __init__(self, max_turns: int = 10, ttl_seconds: int = 3600 * 2) -> None:
        self.max_turns = max_turns
        self.ttl_seconds = ttl_seconds
        # session_id -> list of MessageTurn
        self._sessions: Dict[str, List[MessageTurn]] = {}
        # session_id -> last_activity_timestamp
        self._last_accessed: Dict[str, float] = {}

    def _cleanup_expired(self) -> None:
        now = time.time()
        expired_sessions = [
            sid for sid, last_time in self._last_accessed.items()
            if now - last_time > self.ttl_seconds
        ]
        for sid in expired_sessions:
            self._sessions.pop(sid, None)
            self._last_accessed.pop(sid, None)

    def add_user_message(self, session_id: str, content: str) -> None:
        self._cleanup_expired()
        if session_id not in self._sessions:
            self._sessions[session_id] = []
        self._sessions[session_id].append(MessageTurn(role="user", content=content))
        self._last_accessed[session_id] = time.time()
        self._enforce_window(session_id)

    def add_assistant_message(self, session_id: str, content: str) -> None:
        self._cleanup_expired()
        if session_id not in self._sessions:
            self._sessions[session_id] = []
        self._sessions[session_id].append(MessageTurn(role="assistant", content=content))
        self._last_accessed[session_id] = time.time()
        self._enforce_window(session_id)

    def _enforce_window(self, session_id: str) -> None:
        # Each turn consists of up to 2 messages (user + assistant)
        max_messages = self.max_turns * 2
        history = self._sessions.get(session_id, [])
        if len(history) > max_messages:
            self._sessions[session_id] = history[-max_messages:]

    def get_history(self, session_id: str) -> List[MessageTurn]:
        self._cleanup_expired()
        return list(self._sessions.get(session_id, []))

    def clear_session(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
        self._last_accessed.pop(session_id, None)

    def get_formatted_history(self, session_id: str) -> List[Dict[str, str]]:
        """Format history for Gemini API contents structure (role 'user' and 'model')."""
        history = self.get_history(session_id)
        formatted: List[Dict[str, str]] = []
        for turn in history:
            role = "model" if turn.role == "assistant" else "user"
            formatted.append({"role": role, "text": turn.content})
        return formatted
