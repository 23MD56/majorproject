"""Integration tests for Financial Literacy Client-Side HTML, JS, and CSS markup."""

import pytest
from pathlib import Path


STATIC_DIR = Path(__file__).resolve().parents[2] / "src" / "app" / "static"


def test_index_html_contains_learning_hub_and_chips():
    index_html = (STATIC_DIR / "index.html").read_text(encoding="utf-8")

    # Learning Hub progress tracker and filter pills
    assert "learningProgressTracker" in index_html or "learningProgressText" in index_html
    assert "learningCategoryPills" in index_html or "category-pill" in index_html
    assert "learningHubCarousel" in index_html
    assert "videoFacadesContainer" in index_html or "learningVideoFacades" in index_html

    # Concept detail modal
    assert "conceptDetailModal" in index_html or "conceptDetailsSheet" in index_html

    # Contextual Learn chips in Explore, Grow, Portfolio
    assert 'tab-explore' in index_html
    assert 'tab-grow' in index_html
    assert 'tab-portfolio' in index_html
    assert 'learn-chip' in index_html
    assert 'data-concept="hrp_diversification"' in index_html
    assert 'data-concept="probabilistic_forecasting"' in index_html or 'data-concept="sharpe_ratio"' in index_html
    assert 'data-concept="regime_shift_rebalance"' in index_html or 'data-concept="compounding_sip"' in index_html


def test_app_js_implements_learning_hub_and_persistence():
    app_js = (STATIC_DIR / "app.js").read_text(encoding="utf-8")

    # LocalStorage key
    assert "quantniti_learned_concepts" in app_js

    # Function declarations
    assert "initLearningHub" in app_js or "loadLearningHub" in app_js
    assert "renderLearningCards" in app_js or "renderLearningHub" in app_js
    assert "toggleConceptLearned" in app_js
    assert "openConceptModal" in app_js
    assert "loadVideoFacade" in app_js or "playVideoFacade" in app_js
    assert "askNitiBotAboutConcept" in app_js


def test_styles_css_contains_learning_styles():
    styles_css = (STATIC_DIR / "styles.css").read_text(encoding="utf-8")

    assert ".learn-chip" in styles_css
    assert ".video-facade" in styles_css or ".video-facade-card" in styles_css
    assert ".category-pill" in styles_css or ".learning-category-pill" in styles_css
