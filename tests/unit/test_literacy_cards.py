"""Unit tests for Financial Literacy Microlearning Cards Knowledge Base."""

import json
from pathlib import Path
import pytest
from pydantic import ValidationError

from app.core.models import LiteracyCard, LiteracyCategory


LITERACY_CARDS_PATH = Path(__file__).resolve().parents[2] / "src" / "app" / "data" / "literacy_cards.json"


def test_literacy_cards_file_exists():
    assert LITERACY_CARDS_PATH.exists(), f"File {LITERACY_CARDS_PATH} does not exist"


def test_literacy_cards_schema_and_count():
    assert LITERACY_CARDS_PATH.exists()
    with open(LITERACY_CARDS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert isinstance(data, list), "Knowledge base must be a JSON list of cards"
    assert len(data) >= 30, f"Expected at least 30 micro-lessons, found {len(data)}"

    all_keys = set()
    categories_found = set()

    for item in data:
        card = LiteracyCard(**item)
        assert card.key not in all_keys, f"Duplicate key found: {card.key}"
        all_keys.add(card.key)
        categories_found.add(card.category.value if hasattr(card.category, "value") else card.category)

        # Explanation should be 2 to 4 sentences
        assert 2 <= card.sentence_count <= 4, (
            f"Card '{card.key}' explanation has {card.sentence_count} sentences, expected 2-4"
        )
        # Analogy should be non-empty and descriptive
        assert len(card.analogy.strip()) > 15, f"Card '{card.key}' analogy is too short"

    # All 4 categories must be represented
    expected_categories = {"basics", "regimes", "risk", "quant"}
    assert expected_categories.issubset(categories_found), (
        f"Missing categories: {expected_categories - categories_found}"
    )

    # Validate all related_keys point to valid keys
    for item in data:
        for rel in item.get("related_keys", []):
            assert rel in all_keys, f"Card '{item['key']}' has invalid related_key '{rel}'"
            assert rel != item["key"], f"Card '{item['key']}' references itself"


def test_invalid_literacy_card_fails_validation():
    # Missing required field
    with pytest.raises(ValidationError):
        LiteracyCard(
            key="invalid_card",
            title="Invalid",
            explanation="Only one sentence.",
            category="basics",
            # missing analogy
            related_keys=[],
        )

    # Invalid category
    with pytest.raises(ValidationError):
        LiteracyCard(
            key="invalid_card",
            title="Invalid",
            explanation="Sentence one here. Sentence two here.",
            analogy="A relatable analogy for testing.",
            category="crypto_moonshot",  # Invalid category
            related_keys=[],
        )
