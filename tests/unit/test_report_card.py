"""Unit tests for Sharable Portfolio Report Card generation and Web Share API execution (Ticket #15)."""

import json
import subprocess
from pathlib import Path
import pytest

STATIC_DIR = Path(__file__).resolve().parent.parent.parent / "src" / "app" / "static"


def test_app_js_exports_report_functions():
    """Verify app.js contains valid JavaScript declaring the required functions."""
    app_js = (STATIC_DIR / "app.js").read_text(encoding="utf-8")
    assert "async function generatePortfolioReportBlob" in app_js or "function generatePortfolioReportBlob" in app_js
    assert "async function downloadPortfolioReportPDF" in app_js or "function downloadPortfolioReportPDF" in app_js
    assert "async function sharePortfolioReport" in app_js or "function sharePortfolioReport" in app_js
    assert "function populateReportCard" in app_js


def test_report_blob_generation_and_share_flow_headless():
    """Execute headless verification of report Blob generation and Web Share logic using Node.js."""
    app_js_path = STATIC_DIR / "app.js"
    assert app_js_path.exists()

    # Node.js test script mocking DOM, Chart.js, html2canvas, jsPDF, navigator.share, and clipboard
    test_script = """
    const fs = require('fs');
    const path = require('path');

    // Minimal DOM & Browser Mock
    const mockElements = {};
    function getOrCreateMockElement(id) {
        if (!mockElements[id]) {
            mockElements[id] = {
                id: id,
                innerText: '',
                textContent: '',
                innerHTML: '',
                className: '',
                style: {},
                disabled: false,
                classList: {
                    add: () => {},
                    remove: () => {},
                    toggle: () => {}
                },
                getContext: () => ({
                    clearRect: () => {},
                    fillRect: () => {},
                    drawImage: () => {}
                }),
                appendChild: () => {},
                removeChild: () => {},
                remove: () => {},
                closest: () => ({ remove: () => {} }),
                contains: () => true,
                setAttribute: () => {},
                getAttribute: () => null,
                addEventListener: () => {},
                removeEventListener: () => {}
            };
        }
        return mockElements[id];
    }

    global.document = {
        getElementById: (id) => getOrCreateMockElement(id),
        createElement: (tag) => {
            const el = getOrCreateMockElement('dynamic_' + Math.random());
            el.tagName = tag.toUpperCase();
            el.click = () => { el.clicked = true; };
            return el;
        },
        body: getOrCreateMockElement('body'),
        addEventListener: () => {}
    };

    global.window = {
        document: global.document,
        location: { origin: 'https://quantniti.in' },
        addEventListener: () => {},
        jspdf: {
            jsPDF: class {
                constructor() {
                    this.internal = {
                        pageSize: {
                            getWidth: () => 210,
                            getHeight: () => 297
                        }
                    };
                }
                getImageProperties() {
                    return { width: 794, height: 1123 };
                }
                addImage() {}
                addPage() {}
                save(name) { this.savedFilename = name; }
                output(type) {
                    if (type === 'blob') {
                        return new Blob([Buffer.from('%PDF-1.4 Mock PDF Content')], { type: 'application/pdf' });
                    }
                    return 'mock_pdf_output';
                }
            }
        }
    };

    // Node 22 navigator properties configuration
    global.lastCopiedText = null;
    const mockClipboard = {
        writeText: async (text) => {
            global.lastCopiedText = text;
        }
    };
    Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, configurable: true, writable: true });
    Object.defineProperty(navigator, 'vibrate', { value: () => {}, configurable: true, writable: true });

    global.Chart = class {
        constructor() {}
        destroy() {}
    };

    global.html2canvas = async function(element, options) {
        return {
            toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            toBlob: (callback, type = 'image/png') => {
                const blob = new Blob([Buffer.from('Mock PNG Image Bytes')], { type });
                callback(blob);
            }
        };
    };

    global.lucide = { createIcons: () => {} };
    global.URL = {
        createObjectURL: () => 'blob:mock-url',
        revokeObjectURL: () => {}
    };
    global.window.URL = global.URL;
    global.localStorage = {
        getItem: () => '[]',
        setItem: () => {},
        removeItem: () => {}
    };
    global.window.localStorage = global.localStorage;

    // Read and evaluate app.js
    const appJsCode = fs.readFileSync((process.argv[1] || process.argv[2]), 'utf-8');
    eval(appJsCode);

    async function runTests() {
        // Set active mock portfolio in AppState
        AppState.activePortfolio = {
            portfolio_id: 'port_test_01',
            name: 'Growth & Income Goal',
            current_value: 124560.50,
            invested_capital: 100000.0,
            total_pnl: 24560.50,
            total_pnl_pct: 24.56,
            pnl_1d: 1250.0,
            pnl_1d_pct: 1.02,
            current_regime: 'Low-Volatility Bull',
            risk_persona: 'Balanced',
            horizon: '6M',
            holdings: [
                { symbol: 'RELIANCE', name: 'Reliance', sector: 'Energy', shares: 15, current_price: 2900, current_value: 43500, weight: 0.35, pnl_1d: 500, pnl_1d_pct: 1.1, unrealized_pnl: 3500, unrealized_pnl_pct: 8.7 },
                { symbol: 'TCS', name: 'Tata Consultancy', sector: 'Technology', shares: 10, current_price: 3900, current_value: 39000, weight: 0.31, pnl_1d: 400, pnl_1d_pct: 1.0, unrealized_pnl: 4000, unrealized_pnl_pct: 11.4 },
                { symbol: 'GOLDBEES', name: 'Nippon Gold ETF', sector: 'Commodities', shares: 500, current_price: 64, current_value: 32000, weight: 0.26, pnl_1d: 200, pnl_1d_pct: 0.6, unrealized_pnl: 2000, unrealized_pnl_pct: 6.7 }
            ],
            benchmark_comparison: {
                portfolio_return_pct: 24.56,
                nifty_return_pct: 18.20,
                alpha_vs_nifty: 6.36
            }
        };

        const results = {};

        // 1. Test PDF Blob Generation
        const pdfResult = await generatePortfolioReportBlob('pdf', 'portfolio');
        results.pdfBlobType = pdfResult.blob.type;
        results.pdfBlobSize = pdfResult.blob.size;
        results.pdfFilename = pdfResult.filename;

        // 2. Test Image (PNG) Blob Generation
        const imgResult = await generatePortfolioReportBlob('image', 'portfolio');
        results.imgBlobType = imgResult.blob.type;
        results.imgBlobSize = imgResult.blob.size;
        results.imgFilename = imgResult.filename;

        // 3. Test Web Share API invocation when supported
        let sharePayload = null;
        Object.defineProperty(navigator, 'share', {
            value: async (payload) => { sharePayload = payload; },
            configurable: true,
            writable: true
        });
        Object.defineProperty(navigator, 'canShare', {
            value: () => true,
            configurable: true,
            writable: true
        });

        await sharePortfolioReport('portfolio');
        results.sharedTitle = sharePayload ? sharePayload.title : null;
        results.sharedTextHasReturn = sharePayload && sharePayload.text && sharePayload.text.includes('+24.56%');
        results.sharedHasFiles = sharePayload && sharePayload.files && sharePayload.files.length > 0;

        // 4. Test Fallback flow when navigator.share is unsupported
        Object.defineProperty(navigator, 'share', { value: undefined, configurable: true, writable: true });
        Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true, writable: true });
        global.lastCopiedText = null;

        await sharePortfolioReport('portfolio');
        results.fallbackCopiedHasReturn = global.lastCopiedText && global.lastCopiedText.includes('+24.56%');

        console.log(JSON.stringify(results));
    }

    runTests().catch(err => {
        console.error('Test script error:', err);
        process.exit(1);
    });
    """

    res = subprocess.run(
        ["node", "-e", test_script, str(app_js_path)],
        capture_output=True,
        text=True,
        check=False
    )
    assert res.returncode == 0, f"Node script failed with: {res.stderr}\n{res.stdout}"
    data = json.loads(res.stdout.strip())
    assert data["pdfBlobType"] == "application/pdf"
    assert data["pdfBlobSize"] > 0
    assert "pdf" in data["pdfFilename"].lower()
    assert data["imgBlobType"] == "image/png"
    assert data["imgBlobSize"] > 0
    assert data["sharedTitle"] is not None
    assert data["sharedTextHasReturn"] is True
    assert data["sharedHasFiles"] is True
    assert data["fallbackCopiedHasReturn"] is True
