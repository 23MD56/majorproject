"""Server-Sent Events (SSE) streaming routes for real-time market data."""

import asyncio
from typing import Optional
from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from app.data.streaming import MarketTickGenerator
from app.universe import normalize_symbol

router = APIRouter(prefix="/stream", tags=["Streaming"])


def get_tick_generator(request: Request) -> MarketTickGenerator:
    """Retrieve or lazily initialize MarketTickGenerator attached to app state."""
    if hasattr(request.app.state, "tick_generator") and request.app.state.tick_generator is not None:
        return request.app.state.tick_generator

    market_svc = getattr(request.app.state, "market_service", None)
    generator = MarketTickGenerator(market_service=market_svc, mode="synthetic")
    request.app.state.tick_generator = generator
    return generator


@router.get("/ticks")
async def stream_ticks(
    request: Request,
    symbols: Optional[str] = Query(None, description="Comma-separated list of symbols (e.g. RELIANCE,TCS,^NSEI)"),
    interval: float = Query(3.0, ge=0.01, le=60.0, description="Tick broadcast interval in seconds"),
    max_ticks: Optional[int] = Query(None, description="Limit ticks to stream before closing"),
):
    """Server-Sent Events (SSE) endpoint broadcasting live market price ticks and heartbeat pings."""
    generator = get_tick_generator(request)

    sym_list = None
    if symbols:
        sym_list = [normalize_symbol(s.strip()) for s in symbols.split(",") if s.strip()]

    async def event_publisher():
        try:
            async for sse_chunk in generator.stream_ticks(
                symbols=sym_list,
                interval_seconds=interval,
                max_ticks=max_ticks,
            ):
                yield sse_chunk
        except (asyncio.CancelledError, GeneratorExit):
            # Client disconnected gracefully
            pass

    return StreamingResponse(
        event_publisher(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream",
        },
    )
