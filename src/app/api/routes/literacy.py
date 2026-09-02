"""Financial Literacy Microlearning REST API Routes."""

import json
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.core.models import LiteracyCard, LiteracyListResponse

router = APIRouter(prefix="/literacy", tags=["Financial Literacy"])

_DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "literacy_cards.json"
_CARDS_CACHE: Optional[List[LiteracyCard]] = None
_CARDS_BY_KEY: Optional[Dict[str, LiteracyCard]] = None


def _get_literacy_data() -> List[LiteracyCard]:
    """Load and cache curated literacy cards from static JSON."""
    global _CARDS_CACHE, _CARDS_BY_KEY
    if _CARDS_CACHE is None:
        if not _DATA_PATH.exists():
            raise RuntimeError(f"Literacy cards database missing at {_DATA_PATH}")
        with open(_DATA_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
        _CARDS_CACHE = [LiteracyCard(**item) for item in raw]
        _CARDS_BY_KEY = {card.key: card for card in _CARDS_CACHE}
    return _CARDS_CACHE


def _get_cards_dict() -> Dict[str, LiteracyCard]:
    """Retrieve indexed dictionary of literacy cards."""
    _get_literacy_data()
    assert _CARDS_BY_KEY is not None
    return _CARDS_BY_KEY


@router.get("/all", response_model=LiteracyListResponse)
def get_all_literacy_cards(
    category: Optional[str] = Query(None, description="Optional category filter (basics, regimes, risk, quant)"),
):
    """Retrieve all curated financial microlearning cards, optionally filtered by category."""
    cards = _get_literacy_data()
    if category:
        cat_lower = category.strip().lower()
        cards = [
            c for c in cards
            if (c.category.value if hasattr(c.category, "value") else str(c.category)).lower() == cat_lower
        ]
    categories = sorted(list({c.category.value if hasattr(c.category, "value") else str(c.category) for c in _get_literacy_data()}))
    return LiteracyListResponse(
        total=len(cards),
        categories=categories,
        cards=cards,
    )


@router.get("/{key}", response_model=LiteracyCard)
def get_literacy_card_by_key(key: str):
    """Retrieve a single microlearning concept card by unique slug key."""
    cards_map = _get_cards_dict()
    clean_key = key.strip().lower()
    if clean_key not in cards_map:
        raise HTTPException(status_code=404, detail=f"Concept not found: {key}")
    return cards_map[clean_key]
