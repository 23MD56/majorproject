"""NitiBot RAG Portfolio Intelligence Service."""

import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Protocol

from app.core.models import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatStatusResponse,
    RAGContextPayload,
)
from app.ml.assistant.context_builder import RAGContextBuilder
from app.ml.assistant.memory import ConversationMemoryManager
from app.ml.assistant.prompt import NITIBOT_SYSTEM_PROMPT
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService

# Optional dependency import
try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False


def _load_env_file_if_present() -> None:
    """Helper to load .env file if present and variables not in os.environ."""
    env_paths = [Path(".env"), Path("../.env"), Path(__file__).resolve().parents[4] / ".env"]
    for p in env_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass


class GeminiClientAdapter:
    """Default adapter communicating with Google Gemini via google-genai SDK."""

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash") -> None:
        self.api_key = api_key
        self.model_name = model_name
        if not HAS_GENAI:
            raise ImportError(
                "google-genai SDK is not installed. Install with `uv add 'google-genai>=1.0.0' --optional ai`"
            )
        self.client = genai.Client(api_key=api_key)

    def generate(self, contents: List[Dict[str, str]], system_instruction: str) -> str:
        """Call Gemini generate_content with system instructions and chat history."""
        # Convert dictionary format to genai content structures or simple formatted text
        formatted_messages = []
        for msg in contents:
            formatted_messages.append(
                types.Content(
                    role=msg["role"],
                    parts=[types.Part.from_text(text=msg["text"])],
                )
            )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
            max_output_tokens=1024,
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=formatted_messages,
            config=config,
        )
        return response.text or "I apologize, but I could not generate a response based on the current context."


class NitiBotService:
    """Core NitiBot service coordinating RAG context retrieval, memory, and Gemini API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-2.5-flash",
        context_builder: Optional[RAGContextBuilder] = None,
        memory_manager: Optional[ConversationMemoryManager] = None,
        client_adapter: Optional[Any] = None,
        regime_service: Optional[RegimeService] = None,
        grow_service: Optional[GrowService] = None,
    ) -> None:
        _load_env_file_if_present()
        self.api_key = api_key if api_key is not None else os.environ.get("GEMINI_API_KEY")
        self.model_name = model_name
        self.memory_manager = memory_manager or ConversationMemoryManager()
        self.context_builder = context_builder or RAGContextBuilder(
            regime_service=regime_service,
            grow_service=grow_service,
        )

        # Initialize client adapter if available
        if client_adapter is not None:
            self.client_adapter = client_adapter
        elif self.api_key and HAS_GENAI:
            try:
                self.client_adapter = GeminiClientAdapter(api_key=self.api_key, model_name=self.model_name)
            except Exception:
                self.client_adapter = None
        else:
            self.client_adapter = None

    def is_available(self) -> bool:
        """Check if NitiBot can serve queries."""
        return bool(self.api_key and (self.client_adapter is not None or HAS_GENAI))

    def get_status(self) -> ChatStatusResponse:
        """Return operational status of NitiBot."""
        available = self.is_available()
        msg = None
        if not self.api_key:
            msg = "GEMINI_API_KEY is not configured in the server environment. NitiBot is disabled."
        elif not HAS_GENAI and self.client_adapter is None:
            msg = "google-genai SDK is not installed in the Python environment."

        return ChatStatusResponse(
            available=available,
            model=self.model_name,
            message=msg,
        )

    def chat(self, request: ChatMessageRequest) -> ChatMessageResponse:
        """Process a user question with RAG grounding and Gemini reasoning."""
        if not self.is_available():
            raise RuntimeError(
                "NitiBot is currently unavailable because GEMINI_API_KEY is not configured or google-genai is missing."
            )

        session_id = request.session_id or str(uuid.uuid4())

        # 1. Retrieve RAG grounding data
        rag_payload: RAGContextPayload = self.context_builder.build_context(
            user_context=request.context
        )

        # 2. Add current user message to session memory
        self.memory_manager.add_user_message(session_id, request.message)

        # 3. Assemble prompt contents with RAG grounding injection
        history = self.memory_manager.get_formatted_history(session_id)
        
        # Inject the active RAG grounding into the latest user query context
        augmented_history: List[Dict[str, str]] = []
        for i, turn in enumerate(history):
            if i == len(history) - 1 and turn["role"] == "user":
                grounded_user_text = (
                    f"### RETRIEVED REAL-TIME QUANTNITI CONTEXT:\n"
                    f"{rag_payload.grounding_text}\n\n"
                    f"### USER QUERY:\n{turn['text']}"
                )
                augmented_history.append({"role": "user", "text": grounded_user_text})
            else:
                augmented_history.append(turn)

        # 4. Generate response via Gemini
        if self.client_adapter is None and self.api_key and HAS_GENAI:
            self.client_adapter = GeminiClientAdapter(api_key=self.api_key, model_name=self.model_name)

        reply_text = self.client_adapter.generate(
            contents=augmented_history,
            system_instruction=NITIBOT_SYSTEM_PROMPT,
        )

        # 5. Record assistant reply in memory
        self.memory_manager.add_assistant_message(session_id, reply_text)

        return ChatMessageResponse(
            reply=reply_text,
            sources=rag_payload.sources,
            session_id=session_id,
        )
