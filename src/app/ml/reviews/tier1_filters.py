"""Tier 1 Deterministic Rule-Based & Regex Anti-Spam Moderation Filter (Ticket #21).

Enforces zero tolerance against contact solicitations, external links,
Telegram pump channels, profanity, and SEBI-prohibited stock tipping.
"""

import re
from typing import Optional, Tuple

# 1. Phone number patterns (Indian mobile, landline with STD, and international)
PHONE_PATTERNS = [
    re.compile(r"(?:\+91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}\b"),              # +91 9876543210 or 98765-43210
    re.compile(r"\b0\d{2,4}[\s\-]\d{6,8}\b"),                             # 022-26543210 (Landline)
    re.compile(r"\+\d{1,3}[\s\-]?(?:\(\d{2,4}\)[\s\-]?)?\d{3,4}[\s\-]?\d{4}\b"),  # +1 (555) 234-5678
    re.compile(r"\b[6-9]\d{9}\b"),                                         # 9820098200 (10-digit mobile)
]

# 2. Email pattern
EMAIL_PATTERN = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", re.IGNORECASE
)

# 3. External URLs and Link Shorteners
URL_PATTERNS = [
    re.compile(r"https?://[^\s]+", re.IGNORECASE),
    re.compile(r"\bwww\.[A-Za-z0-9.-]+\.[A-Za-z]{2,}[^\s]*", re.IGNORECASE),
    re.compile(r"\b(?:bit\.ly|t\.co|tinyurl\.com|goo\.gl)/[A-Za-z0-9_-]+", re.IGNORECASE),
]

# 4. Telegram handles and invite links
TELEGRAM_PATTERNS = [
    re.compile(r"(?:t\.me|telegram\.me)/[A-Za-z0-9_]+", re.IGNORECASE),
    re.compile(r"(?:^|\s)@([A-Za-z0-9_]{3,})\b"),
]

# 5. WhatsApp and direct contact solicitation keywords
CONTACT_SOLICITATION_PATTERN = re.compile(
    r"\b(?:whatsapp|wa\.me|ping me|dm me|call me|reach my desk|contact on|contact at)\b",
    re.IGNORECASE,
)

# 6. SEBI-prohibited stock tipping and guaranteed profit language
STOCK_TIPPING_PATTERNS = [
    re.compile(r"\b(?:buy\s+(?:now|[A-Z]{3,}))\b.*\b(?:target|jackpot|sure\s*shot)\b", re.IGNORECASE),
    re.compile(r"\b(?:hot\s*tip|multibagger\s*tip|stock\s*tip|trading\s*call|jackpot\s*call|pump\s*this)\b", re.IGNORECASE),
    re.compile(r"\b(?:guaranteed|assured|sure\s*shot|100%|risk\s*free)\s*(?:profit|return|gain|target)\b", re.IGNORECASE),
    re.compile(r"\b(?:target\s*price\s*\d+|sure\s*shot\s*(?:call|put|trade))\b", re.IGNORECASE),
    re.compile(r"\b(?:buy\s+now|sell\s+now)\b", re.IGNORECASE),
]

# 7. Obscene / abusive language
PROFANITY_WORDS = {
    "bullshit", "scam", "idiot", "idiots", "bastard", "fraudster", "cheat",
    "scammer", "fucking", "shit", "bitch", "asshole",
}


def filter_tier1_content(text: str) -> Tuple[bool, Optional[str]]:
    """Run Tier 1 deterministic checks against review content.
    
    Returns:
        (is_safe, rejection_reason): Tuple indicating approval status and reason if rejected.
    """
    if not text or not text.strip():
        return False, "Review text cannot be empty."

    cleaned_text = text.strip()

    # Check for Telegram handles and links first
    for pattern in TELEGRAM_PATTERNS:
        if pattern.search(cleaned_text):
            return False, "Prohibited Telegram handle or group invitation link detected."

    # Check for URLs
    for pattern in URL_PATTERNS:
        if pattern.search(cleaned_text):
            return False, "Prohibited external links or website URLs detected."

    # Check for Email addresses
    if EMAIL_PATTERN.search(cleaned_text):
        return False, "Prohibited personal email or contact information detected."

    # Check for Phone numbers
    for pattern in PHONE_PATTERNS:
        if pattern.search(cleaned_text):
            return False, "Prohibited phone number or contact information detected."

    # Check for Contact solicitations (e.g. 'whatsapp me', 'dm me')
    if CONTACT_SOLICITATION_PATTERN.search(cleaned_text):
        return False, "Prohibited direct messaging or off-platform contact solicitation detected."

    # Check for SEBI prohibited stock tips and guaranteed claims
    for pattern in STOCK_TIPPING_PATTERNS:
        if pattern.search(cleaned_text):
            return False, "Prohibited speculative stock tips or guaranteed profit claims detected."

    # Check for profanity / abusive words
    words = set(re.findall(r"\b[A-Za-z]+\b", cleaned_text.lower()))
    abusive_matches = words.intersection(PROFANITY_WORDS)
    if abusive_matches:
        return False, f"Inappropriate or abusive language detected ({', '.join(sorted(abusive_matches))})."

    return True, None
