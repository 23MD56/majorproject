"""Unit tests for PWA configuration, manifest schema, and service worker assets."""

import json
from pathlib import Path
import pytest


STATIC_DIR = Path(__file__).resolve().parent.parent.parent / "src" / "app" / "static"


def test_manifest_file_exists_and_valid():
    """Verify manifest.json exists and adheres to PWA specification."""
    manifest_path = STATIC_DIR / "manifest.json"
    assert manifest_path.exists(), "manifest.json must exist in static directory"

    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Core required properties per issue #11
    assert data.get("name") == "QuantNiti" or "QuantNiti" in data.get("name", "")
    assert data.get("short_name") == "QuantNiti"
    assert data.get("display") == "standalone"
    assert data.get("theme_color") == "#09090b"
    assert data.get("background_color") == "#09090b"
    assert data.get("start_url") == "/"
    assert "id" in data
    assert data.get("id") in ["quantniti", "/"]

    # Responsive Icon entries
    icons = data.get("icons", [])
    assert len(icons) >= 2, "At least 192x192 and 512x512 icons must be specified"

    sizes = [icon.get("sizes") for icon in icons]
    assert "192x192" in sizes
    assert "512x512" in sizes

    purposes = [icon.get("purpose") for icon in icons if "purpose" in icon]
    assert any("maskable" in p for p in purposes if p), "Must include a maskable icon entry"


def test_icon_assets_exist():
    """Verify generated icon files exist in static/icons."""
    icons_dir = STATIC_DIR / "icons"
    assert icons_dir.exists(), "icons directory must exist"

    expected_files = [
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-192.png",
        "icon-maskable-512.png",
        "icon.svg",
    ]
    for filename in expected_files:
        icon_path = icons_dir / filename
        assert icon_path.exists(), f"Icon {filename} must exist"
        assert icon_path.stat().st_size > 0, f"Icon {filename} must not be empty"


def test_service_worker_script_structure():
    """Verify sw.js service worker implementation."""
    sw_path = STATIC_DIR / "sw.js"
    assert sw_path.exists(), "sw.js must exist in static directory"

    content = sw_path.read_text(encoding="utf-8")
    assert "skipWaiting" in content, "Service worker must call skipWaiting()"
    assert "clients.claim" in content, "Service worker must claim clients on activate"
    assert "install" in content, "Service worker must handle install event"
    assert "activate" in content, "Service worker must handle activate event"
    assert "fetch" in content, "Service worker must handle fetch event"
    assert "offline.html" in content or "offline" in content.lower(), "Must reference offline fallback"


def test_offline_page_exists_and_styled():
    """Verify offline.html fallback exists and matches design system."""
    offline_path = STATIC_DIR / "offline.html"
    assert offline_path.exists(), "offline.html must exist"

    content = offline_path.read_text(encoding="utf-8")
    assert "QuantNiti" in content
    assert "Offline" in content or "offline" in content.lower()
    assert "styles.css" in content or "tailwindcss" in content or "bg-" in content


def test_desktop_responsive_css_rules():
    """Verify CSS has media query for min-width: 1024px persistent sidebar layout."""
    css_path = STATIC_DIR / "styles.css"
    assert css_path.exists(), "styles.css must exist"

    css_content = css_path.read_text(encoding="utf-8")
    assert "@media" in css_content and "1024px" in css_content, "Must contain @media (min-width: 1024px)"
    assert "240px" in css_content, "Must contain 240px persistent sidebar specification"
