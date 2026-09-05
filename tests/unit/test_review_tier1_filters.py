"""Unit tests for Review Verification Tier 1 Deterministic Rules and Anti-Spam Filters (Ticket #21)."""

import pytest
from app.ml.reviews.tier1_filters import filter_tier1_content


def test_tier1_clean_reviews_pass():
    """Verify clean, constructive reviews pass Tier 1 checks."""
    clean_reviews = [
        "The Hierarchical Risk Parity allocation really helped protect my downside during the volatility spike.",
        "Great portfolio transparency and explainable risk guardrails. I made about +12% over 6 months.",
        "Clean UI, very responsive, and much easier to navigate than traditional terminals.",
        "The regime transition alert alerted me to de-risk before the consolidation phase.",
    ]
    for text in clean_reviews:
        is_safe, reason = filter_tier1_content(text)
        assert is_safe is True, f"Failed for clean text: {text} - reason: {reason}"
        assert reason is None


def test_tier1_blocks_phone_numbers():
    """Verify phone numbers in Indian and international formats are blocked."""
    spam_reviews = [
        "Call me on +91 9876543210 for real trading secrets",
        "WhatsApp me at 9876543210 for daily stock insights",
        "Reach my desk at 022-26543210 or 9820098200",
        "Direct contact: +1 (555) 234-5678",
    ]
    for text in spam_reviews:
        is_safe, reason = filter_tier1_content(text)
        assert is_safe is False, f"Should have blocked phone number in: {text}"
        assert "contact" in reason.lower() or "phone" in reason.lower()


def test_tier1_blocks_email_addresses():
    """Verify email addresses are blocked."""
    spam_reviews = [
        "Email me at profit.guru@gmail.com for private portfolio consultation",
        "Send your query to trader@hedgefund.co.in",
    ]
    for text in spam_reviews:
        is_safe, reason = filter_tier1_content(text)
        assert is_safe is False, f"Should have blocked email in: {text}"
        assert "email" in reason.lower() or "contact" in reason.lower()


def test_tier1_blocks_external_urls():
    """Verify external URLs, domain links, and link shorteners are blocked."""
    spam_reviews = [
        "Check out my detailed strategy at https://mytradingblog.com/strategy",
        "Join our room www.fastprofits.in for daily updates",
        "Detailed proof available at http://bit.ly/3xAlpha",
    ]
    for text in spam_reviews:
        is_safe, reason = filter_tier1_content(text)
        assert is_safe is False, f"Should have blocked URL in: {text}"
        assert "link" in reason.lower() or "url" in reason.lower()


def test_tier1_blocks_telegram_and_social_handles():
    """Verify Telegram handles, channels, and invite links are blocked."""
    spam_reviews = [
        "Join our channel t.me/nifty_rocket_calls for daily 10% gains",
        "DM me on Telegram @nifty_wizard for VIP access",
        "Follow https://telegram.me/stock_gurus_india",
    ]
    for text in spam_reviews:
        is_safe, reason = filter_tier1_content(text)
        assert is_safe is False, f"Should have blocked telegram in: {text}"
        assert "telegram" in reason.lower() or "contact" in reason.lower()


def test_tier1_blocks_prohibited_stock_tips():
    """Verify SEBI-prohibited stock tips and guaranteed profit language are blocked."""
    prohibited_reviews = [
        "Buy RELIANCE now! Guaranteed target 3500 by Friday, sure shot jackpot call!",
        "Hot tip: pump this stock tomorrow for 100% guaranteed profit!",
        "Multibagger tip for intraday options: sure shot call option!",
    ]
    for text in prohibited_reviews:
        is_safe, reason = filter_tier1_content(text)
        assert is_safe is False, f"Should have blocked stock tipping in: {text}"
        assert "tip" in reason.lower() or "guaranteed" in reason.lower() or "prohibited" in reason.lower()


def test_tier1_blocks_profanity():
    """Verify offensive language and profanity are blocked."""
    abusive_text = "This platform is complete scam bullshit you idiots"
    is_safe, reason = filter_tier1_content(abusive_text)
    assert is_safe is False
    assert "inappropriate" in reason.lower() or "language" in reason.lower()
