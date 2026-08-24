"""NitiBot RAG Portfolio Intelligence conversational API endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Request, status

from app.core.models import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatStatusResponse,
)
from app.ml.assistant.service import NitiBotService

router = APIRouter(tags=["NitiBot RAG Assistant"])


def get_nitibot_service(request: Request) -> NitiBotService:
    """Retrieve NitiBotService instance from application state."""
    service: Optional[NitiBotService] = getattr(request.app.state, "nitibot_service", None)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NitiBot assistant service is not initialized.",
        )
    return service


@router.get(
    "/chat/status",
    response_model=ChatStatusResponse,
    summary="Check NitiBot AI Assistant operational status",
    description="Returns whether Gemini API key is configured and NitiBot can answer queries.",
)
async def get_chat_status(request: Request) -> ChatStatusResponse:
    service = get_nitibot_service(request)
    return service.get_status()


@router.post(
    "/chat",
    response_model=ChatMessageResponse,
    summary="Ask NitiBot a question with real-time RAG portfolio grounding",
    description="Grounded in live QuantNiti data (regime, basket, growth quantiles, trust card, backtest).",
)
async def post_chat_message(
    payload: ChatMessageRequest,
    request: Request,
) -> ChatMessageResponse:
    service = get_nitibot_service(request)
    if not service.is_available():
        status_info = service.get_status()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=status_info.message or "GEMINI_API_KEY is not configured in the environment.",
        )

    try:
        return service.chat(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating NitiBot response: {str(exc)}",
        )
