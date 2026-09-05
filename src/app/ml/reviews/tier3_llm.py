"""Tier 3 LLM Astroturfing & Promotional Intent Check (Ticket #21).

Uses Gemini 2.5 Flash (with graceful deterministic heuristic fallback)
to detect promotional astroturfing, disguised marketing, and coordinated manipulation.
"""

import logging
import re
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

# Heuristic patterns for promotional astroturfing
PROMOTIONAL_PATTERNS = [
    re.compile(r"\b(?:best\s+trader\s+in\s+india|join\s+vip|inbox\s+for\s+details)\b", re.IGNORECASE),
    re.compile(r"\b(?:free\s+trial|subscription\s+discount|referral\s+code)\b", re.IGNORECASE),
    re.compile(r"\b(?:100%\s+genuine|100%\s+working|sure\s+win)\b", re.IGNORECASE),
]


def audit_tier3_llm(text: str, user_name: str = "") -> Tuple[bool, Optional[str]]:
    """Run Tier 3 review integrity audit against promotional astroturfing.
    
    Returns:
        (is_safe, audit_notes): Boolean flag and audit notes.
    """
    if not text:
        return True, "Empty text."

    # 1. Deterministic Heuristic Check
    for pattern in PROMOTIONAL_PATTERNS:
        if pattern.search(text):
            return False, "Detected disguised promotional marketing or astroturfing pattern."

    # Excessive capitalization check (> 60% uppercase with len > 30)
    alpha_chars = [c for c in text if c.isalpha()]
    if len(alpha_chars) > 30:
        upper_ratio = sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
        if upper_ratio > 0.65:
            return False, "Excessive capitalization detected indicating promotional spam."

    # 2. Optional LLM Audit with Gemini if API key configured
    api_key = getattr(settings, "gemini_api_key", None)
    if api_key and len(api_key) > 10:
        try:
            # Using Google GenAI SDK if available
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = (
                "You are an expert SEBI compliance auditor and review integrity fact-checker. "
                "Evaluate the following user review for: (1) promotional astroturfing, (2) covert stock tipping, "
                "or (3) deceptive spam. Respond with ONLY 'APPROVED' or 'REJECTED: <reason>'.\n\n"
                f"Reviewer: {user_name}\n"
                f"Review Text: \"{text}\""
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            resp_text = response.text.strip() if response and response.text else "APPROVED"
            if resp_text.startswith("REJECTED"):
                reason = resp_text.replace("REJECTED:", "").strip() or "Failed LLM review integrity audit."
                return False, reason
            return True, "Passed Gemini 2.5 Flash review integrity audit."
        except Exception as e:
            logger.debug(f"Tier 3 LLM check skipped, using deterministic fallback: {e}")

    return True, "Passed deterministic review integrity audit."
