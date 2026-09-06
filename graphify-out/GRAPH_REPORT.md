# Graph Report - iteration2  (2026-09-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3449 nodes · 7128 edges · 228 communities (172 shown, 51 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 611 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `411f7dc9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MarketDataService
- models.py
- forecasting/service.py
- data/service.py
- NitiBotService
- useAppStore.ts
- gray
- framer-motion
- ReviewTargetType
- SmartAlertType
- extract_stock_factors
- market.py
- PortfolioPage.tsx
- GrowPage.tsx
- lucide-react
- MarketRegimeType
- design_system.py
- telemetry_common.cjs
- validate_data.py
- static/app.js
- legacy/app.js
- compounding_engine.py
- react
- DiscreteAllocationEngine
- AppShell.tsx
- search_stack
- DesignSystemGenerator
- slide_search_core.py
- MarketTickGenerator
- routes/portfolio.py
- simulation/service.py
- test_design_system_mode.py
- search
- html-token-validator.py
- TestTailwindConfigGenerator
- scripts/core.py
- test_data_contracts.py
- icon/generate.py
- search
- validate_ohlcv_dataframe
- alerts.py
- test_multi_asset_universe.py
- test_core_data_quality.py
- literacy.py
- BacktestResultData
- ReviewRepository
- ReviewService
- MarketRegimeClassifier
- spacing
- generate-slide.py
- TailwindConfigGenerator
- OnboardingHero.tsx
- BM25
- detect_domain
- StrategyType
- ConversationMemoryManager
- filter_tier1_content
- test_backtest_engine.py
- test_hrp_optimizer.py
- fetch-background.py
- color
- template.sh
- extract_regime_features
- triggerHaptic
- triggerHaptic
- compilerOptions
- logo/core.py
- TestThresholdGate
- FastAPI
- renderHomeTab
- renderHomeTab
- BM25
- CatalogRefreshTest
- package.json
- grow.py
- MarketStreamClient
- fontSize
- TestShadcnInstaller
- PortfolioRepository
- renderNotificationList
- renderNotificationList
- list-components.js
- .generate
- devDependencies
- hrp.py
- closeModalSheet
- closeModalSheet
- asyncio
- extract-colors.cjs
- validate-asset.cjs
- radius
- backtest.py
- manifest.json
- design-tokens-starter.json
- RiskPersona
- ._get_file_path
- BacktestEngine
- escapeHtml
- escapeHtml
- test_portfolio_storage.py
- validate-tokens.cjs
- card
- generate_viewer.py
- .check_shadcn_config
- .generate_config_string
- _style_is_dark_primary
- Base
- test_pwa_unit.py
- inject-brand-context.cjs
- embed-tokens.cjs
- ShadcnInstaller
- patch
- test_tailwind_config_gen.py
- test_text_layout_resilience.py
- dependencies
- asyncio
- asyncio
- asyncio
- test_basket_growth_calculator.py
- generate-tokens.cjs
- button
- duration
- ._base_config
- compute_regime_suitability
- test_chat_api.py
- test_client_serving.py
- test_review_verification_agent.py
- sync-brand-to-tokens.cjs
- render-html.py
- _run
- _normalize
- compute_shrunk_covariance
- test_api_routes.py
- asyncio
- asyncio
- asyncio
- test_explore_api.py
- asyncio
- asyncio
- asyncio
- base_portfolio
- input
- fetch.js
- _row_identities
- test_literacy_api.py
- compilerOptions
- MarketStreamClient
- MarketStreamClient
- asyncio
- test_cache.py
- snapshot-android.sh
- test_report_card.py
- $type
- radius
- lg
- sm
- scripts/package.json
- scripts
- setup.ts
- get_current_regime
- test_literacy_client.py
- test_portfolio_full_lifecycle_api
- slide-token-validator.py
- padding-y
- xl
- none
- hitl-loop.template.sh
- vite.config.ts
- test_sync_brand_to_tokens.py
- 16
- 1
- 3
- 8
- destructive
- destructive-foreground
- muted
- primary-foreground
- ring
- secondary-foreground
- check-static.sh
- snapshot-ios.sh
- snapshot-web.sh
- .__init__
- graphify.js
- clean-fixture.sh
- latest-sdk.sh
- make-fixture.sh
- make-workspace.sh
- .test_add_components_no_config
- .test_add_components_already_installed
- .test_list_installed_empty
- .test_init_custom_project_root
- .test_init_dry_run
- .test_check_shadcn_config_exists
- .test_get_installed_components_empty
- .test_get_installed_components_with_files
- .test_add_components_no_components
- .test_add_colors_multiple_times
- .test_add_fonts
- .test_add_spacing
- .test_add_breakpoints
- .test_recommend_plugins
- .test_recommend_plugins_nextjs
- .test_generate_typescript_config
- .test_init_default_typescript
- .test_validate_config_no_content
- .test_write_config
- .test_write_config_creates_content
- .test_write_config_invalid_path
- .test_init_framework
- .test_full_configuration_javascript
- .test_custom_output_path
- .test_default_content_paths_react
- .test_default_content_paths_vue
- .test_add_colors
- core/__init__.py
- data/__init__.py
- app/__init__.py
- forecasting/__init__.py
- ml/__init__.py
- regime/__init__.py
- sw.js
- app

## God Nodes (most connected - your core abstractions)
1. `MarketDataService` - 82 edges
2. `react` - 67 edges
3. `MarketRegimeType` - 59 edges
4. `TailwindConfigGenerator` - 58 edges
5. `RegimeService` - 57 edges
6. `RiskPersona` - 50 edges
7. `useAppStore` - 45 edges
8. `search()` - 43 edges
9. `lucide-react` - 43 edges
10. `PortfolioState` - 42 edges

## Surprising Connections (you probably didn't know these)
- `test_cache_invalidation()` --uses--> `ParquetMarketCache`  [INFERRED]
  tests/unit/test_cache.py → src/app/data/cache.py
- `test_cache_save_and_load()` --uses--> `ParquetMarketCache`  [INFERRED]
  tests/unit/test_cache.py → src/app/data/cache.py
- `test_cache_ttl_expiration()` --uses--> `ParquetMarketCache`  [INFERRED]
  tests/unit/test_cache.py → src/app/data/cache.py
- `test_get_growth_forecast()` --uses--> `MultiHorizonGrowthForecast`  [INFERRED]
  tests/integration/test_explore_service.py → src/app/core/models.py
- `test_list_explore_stocks_and_filter()` --uses--> `ExploreStockSummary`  [INFERRED]
  tests/integration/test_explore_service.py → src/app/core/models.py

## Import Cycles
- None detected.

## Communities (228 total, 51 thin omitted)

### Community 0 - "MarketDataService"
Cohesion: 0.04
Nodes (87): create_app(), Create and configure the FastAPI application instance., PushSubscriptionRequest, ParquetMarketCache, Return list of all cached symbols in the directory., Manages fast on-disk Parquet caching for historical OHLCV data., MockDataProvider, Deterministic synthetic market data provider for offline testing and… (+79 more)

### Community 1 - "models.py"
Cohesion: 0.05
Nodes (67): get_regime_service(), BaseModel, post, Request, Market Regime REST API Routes., Dependency provider for RegimeService attached to application state., Trigger explicit training/fitting of the unsupervised regime classifier., train_regime_model() (+59 more)

### Community 2 - "forecasting/service.py"
Cohesion: 0.05
Nodes (60): get_explore_service(), get_growth_forecast(), get_stock_profile(), get_ticker_esg(), list_explore_stocks(), get, Request, Explore Tab REST API Routes for Stock Intelligence and Multi-Horizon Forecasts. (+52 more)

### Community 3 - "data/service.py"
Cohesion: 0.05
Nodes (49): ABC, FastAPI Application Factory for QuantNiti., BaseModel, Configuration settings for QuantNiti., Settings, High-performance Parquet-based market data cache., MarketDataProvider, Market data providers for QuantNiti (Yahoo Finance and Mock Provider). (+41 more)

### Community 4 - "NitiBotService"
Cohesion: 0.07
Nodes (41): get_chat_status(), get_nitibot_service(), post_chat_message(), get, post, Request, NitiBot RAG Portfolio Intelligence conversational API endpoints., Retrieve NitiBotService instance from application state. (+33 more)

### Community 5 - "useAppStore.ts"
Cohesion: 0.07
Nodes (34): GrowPage(), AdaptiveHomeCard(), AdaptiveHomeCardProps, CompoundingVisualizer(), CompoundingVisualizerProps, LearningHub(), LearningHubProps, MarketPulse() (+26 more)

### Community 6 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 7 - "framer-motion"
Cohesion: 0.07
Nodes (33): framer-motion, ASSETS, STRATEGIES, ExploreStockItem, StockCard(), StockCardProps, StockProfileModal(), StockProfileModalProps (+25 more)

### Community 8 - "ReviewTargetType"
Cohesion: 0.08
Nodes (38): Enum, LiteracyCategory, ReviewStatus, ReviewTargetType, ReviewVerificationResult, Any, ReviewVerificationAgent (Ticket #21). Autonomous 3-Tier AI moderation &…, 3-Tier automated moderation and ground-truth fact-checking agent. (+30 more)

### Community 9 - "SmartAlertType"
Cohesion: 0.09
Nodes (42): AlertSeverity, SmartAlert, SmartAlertType, evaluate_52w_high_breakout(), evaluate_drawdown_breach(), evaluate_factor_anomaly(), evaluate_portfolio_drift(), evaluate_regime_transition() (+34 more)

### Community 10 - "extract_stock_factors"
Cohesion: 0.07
Nodes (38): HorizonForecastCone, MultiHorizonGrowthForecast, compute_bollinger_bands(), compute_ema(), compute_macd(), compute_max_drawdown(), compute_rsi(), compute_stock_beta_and_alpha() (+30 more)

### Community 11 - "market.py"
Cohesion: 0.06
Nodes (35): get_history(), get_market_service(), get_quote(), get_returns_matrix(), get_universe(), BaseModel, get, post (+27 more)

### Community 12 - "PortfolioPage.tsx"
Cohesion: 0.12
Nodes (25): OrderSheetModalProps, PortfolioReportCardProps, CompoundingTrajectoryChart(), CompoundingTrajectoryChartProps, CreatePortfolioModal(), DemoPortfolio(), DemoPortfolioProps, BenchmarkComparison (+17 more)

### Community 13 - "GrowPage.tsx"
Cohesion: 0.10
Nodes (27): chart.js, react-chartjs-2, AllocationDonut(), AllocationDonutProps, AllocationItem, PALETTE, GrowSkeleton(), Step1Capital() (+19 more)

### Community 14 - "lucide-react"
Cohesion: 0.12
Nodes (26): lucide-react, VIDEO_EXPLAINERS, VideoFacadeItem, VideoFacades(), VideoFacadesProps, COMPARISON_ROWS, CompetitorBenchmarkModal(), CompetitorBenchmarkModalProps (+18 more)

### Community 15 - "MarketRegimeType"
Cohesion: 0.11
Nodes (30): BenchmarkComparisonLive, MarketRegimeType, PortfolioHolding, PortfolioState, Persistent Multi-Portfolio Storage Engine (Ticket #19). Provides SQLite…, Fetch complete portfolio state by ID., Virtual Paper Portfolio Simulation and Rebalancing Engine., calculate_day_over_day_mtm() (+22 more)

### Community 16 - "design_system.py"
Cohesion: 0.07
Nodes (33): format_output(), Format results for Claude consumption (token-optimized), ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md() (+25 more)

### Community 17 - "telemetry_common.cjs"
Cohesion: 0.10
Nodes (34): eventPayload(), fs, main(), parseArgs(), path, pluginRootFor(), {
  POSTHOG_PROJECT_API_KEY,
  SOURCE,
  telemetryActive,
  telemetryConfigured,
  detectHarness,
  platformProps,
  telemetryIdentity,
  sendToPosthog,
}, readHookInput() (+26 more)

### Community 18 - "validate_data.py"
Cohesion: 0.11
Nodes (35): _catalog_date(), _check_app_interface_contract(), _check_catalog_contract(), _check_catalog_summary(), _check_color_contract(), _check_core_data_contract(), _check_file(), _check_font_catalog() (+27 more)

### Community 19 - "static/app.js"
Cohesion: 0.08
Nodes (31): AppState, closeWriteReviewModal(), enablePushNotifications(), fetchCurrentRegime(), filterBySector(), filterStocks(), formatMarkdownResponse(), generateBasket() (+23 more)

### Community 20 - "legacy/app.js"
Cohesion: 0.08
Nodes (31): AppState, closeWriteReviewModal(), enablePushNotifications(), fetchCurrentRegime(), filterBySector(), filterStocks(), formatMarkdownResponse(), generateBasket() (+23 more)

### Community 21 - "compounding_engine.py"
Cohesion: 0.09
Nodes (34): CompoundingMonthlyPoint, CompoundingRequest, CompoundingResponse, CompoundingSummary, CompoundingTippingPoint, CompoundingYearlyPoint, calculate_lump_sum(), calculate_monthly_sip() (+26 more)

### Community 22 - "react"
Cohesion: 0.14
Nodes (16): react, react-router-dom, @testing-library/react, @testing-library/user-event, vitest, App(), Theme, ThemeContext (+8 more)

### Community 23 - "DiscreteAllocationEngine"
Cohesion: 0.09
Nodes (20): DiscreteAllocationEngine, DiscreteAllocationResult, Discrete Integer Allocation and Cash Buffer Engine. Converts continuous…, Allocate discrete whole shares using Mixed-Integer Linear Programming (MILP).…, Result of discrete portfolio allocation., Allocate discrete whole shares with automatic solver selection., Construct DiscreteAllocationResult from shares, prices, and capital., Return zero allocation with all cash unallocated. (+12 more)

### Community 24 - "AppShell.tsx"
Cohesion: 0.11
Nodes (24): AppShell(), BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, triggerHaptic(), Header(), HeaderProps (+16 more)

### Community 25 - "search_stack"
Cohesion: 0.10
Nodes (8): Search stack-specific guidelines, search_stack(), Freshness and migration contracts for native, desktop, and 3D stacks., _rows(), TestNativeDesktopStackFreshness, Freshness and generation-isolation contracts for web stack guidance., _rows(), TestWebStackFreshness

### Community 26 - "DesignSystemGenerator"
Cohesion: 0.11
Nodes (8): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Select best matching result based on priority keywords., TestReasoningMatch, read_rows(), TestGeneratedCatalogContract, TestReasoningContract

### Community 27 - "slide_search_core.py"
Cohesion: 0.13
Nodes (29): format_context(), format_result(), main(), Format a single search result for display, Slide Search CLI - Search slide design databases for strategies, layouts, copy,…, Format contextual recommendations for display., calculate_pattern_break(), detect_domain() (+21 more)

### Community 28 - "MarketTickGenerator"
Cohesion: 0.09
Nodes (23): MarketTick, get_tick_generator(), get, Request, Retrieve or lazily initialize MarketTickGenerator attached to app state., Server-Sent Events (SSE) endpoint broadcasting live market price ticks and…, stream_ticks(), MarketTick (+15 more)

### Community 29 - "routes/portfolio.py"
Cohesion: 0.11
Nodes (30): apply_rebalance_endpoint(), calculate_compounding_endpoint(), create_portfolio_endpoint(), delete_portfolio_endpoint(), get_order_sheet_endpoint(), get_portfolio_endpoint(), get_portfolio_service(), get_rebalance_diff_endpoint() (+22 more)

### Community 30 - "simulation/service.py"
Cohesion: 0.11
Nodes (24): BrokerOrderItem, BrokerOrderSheet, RebalanceAlert, RebalanceItemDiff, compute_rebalance_diff(), execute_rebalance(), generate_broker_order_sheet(), Any (+16 more)

### Community 31 - "test_design_system_mode.py"
Cohesion: 0.11
Nodes (15): _contrast_ratio(), _derive_dark_palette(), _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., WCAG contrast ratio for two hex colors, or None if either is invalid., Keep product brand tokens while deriving accessible dark surfaces., Pick the highest-ranked palette matching the resolved mode. Only the dark case… (+7 more)

### Community 32 - "search"
Cohesion: 0.12
Nodes (26): detect_domain(), get_cip_brief(), Generate a comprehensive CIP brief for a brand, CIP Design Core - BM25 search engine for Corporate Identity Program design…, search(), search_all(), build_cip_prompt(), check_logo_required() (+18 more)

### Community 33 - "html-token-validator.py"
Cohesion: 0.12
Nodes (25): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+17 more)

### Community 34 - "TestTailwindConfigGenerator"
Cohesion: 0.07
Nodes (15): Test adding full color palette., Test TailwindConfigGenerator class., Test that adding same plugin twice doesn't duplicate., Test generating JavaScript configuration., Test generating config with custom colors., Test generating config with plugins., Test validating valid configuration., Test validating config with empty theme extensions. (+7 more)

### Community 35 - "scripts/core.py"
Cohesion: 0.11
Nodes (28): _contains_phrase(), _domain_keywords(), _exact_stack_identifier(), _file_signature(), _get_bm25(), _load_csv(), _load_csv_snapshot(), _load_product_keywords() (+20 more)

### Community 36 - "test_data_contracts.py"
Cohesion: 0.10
Nodes (14): Find matching reasoning rule for a category., Apply reasoning rules to search results., apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), Return deterministic mutations and an audit trail; never execute data., Closed, non-executable grammar for design-system decision rules., Parse the canonical condition -> action-array representation. (+6 more)

### Community 37 - "icon/generate.py"
Cohesion: 0.11
Nodes (25): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+17 more)

### Community 38 - "search"
Cohesion: 0.12
Nodes (7): Resolve a deprecated in-domain alias, or expose a cross-domain redirect., search(), _style_search_destination(), TestSearchDomains, Regression tests for the public style taxonomy and search contract., read_rows(), TestStyleTaxonomy

### Community 39 - "validate_ohlcv_dataframe"
Cohesion: 0.10
Nodes (22): DatetimeIndex, align_to_trading_calendar(), calculate_returns(), DataFrame, Data validation, anomaly cleaning, date alignment, and returns calculation., Align asset OHLCV dataframe with canonical trading calendar. Missing trading…, Calculate daily simple return, log return, and cumulative return series., Validate OHLCV data invariants and drop invalid or corrupted records.… (+14 more)

### Community 40 - "alerts.py"
Cohesion: 0.14
Nodes (26): clear_alerts(), evaluate_alerts_micro_batch(), get_alert_service(), get_vapid_public_key(), list_alerts(), mark_alert_read(), mark_all_alerts_read(), delete (+18 more)

### Community 41 - "test_multi_asset_universe.py"
Cohesion: 0.09
Nodes (25): AssetClass, SyncResult, Batch-sync and cache historical market data for universe stocks., get_asset_class_for_symbol(), get_universe_symbols(), Retrieve the asset class taxonomy for a given symbol., Return list of canonical symbols in the universe., Unit tests for Multi-Asset Universe Expansion (Ticket 17). Verifies asset… (+17 more)

### Community 42 - "test_core_data_quality.py"
Cohesion: 0.14
Nodes (13): Semantic quality contracts for the core UI/UX datasets., read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _check_chart_contract(), _check_icon_contract() (+5 more)

### Community 43 - "literacy.py"
Cohesion: 0.11
Nodes (19): get_all_literacy_cards(), _get_cards_dict(), get_literacy_card_by_key(), _get_literacy_data(), get, Financial Literacy Microlearning REST API Routes., Load and cache curated literacy cards from static JSON., Retrieve indexed dictionary of literacy cards. (+11 more)

### Community 44 - "BacktestResultData"
Cohesion: 0.15
Nodes (21): BacktestMetrics, BacktestTrade, RegimePerformanceBreakdown, BacktestResultData, Vectorized Quantitative Strategy Backtesting Engine., Raw result time series and trade logs from a backtest execution., Strategy Backtesting and Quantitative Evaluation Studio Engine., calculate_backtest_metrics() (+13 more)

### Community 45 - "ReviewRepository"
Cohesion: 0.12
Nodes (18): ReviewItem, ReviewSummary, Relational Database Repository for Reviews & Fact-Checking Audit Records…, Calculate aggregate community rating summary and verified counts., Seed representative verified and qualitative reviews for NIFTY basket preview., SQLAlchemy persistence manager for User Reviews and AI Fact-Checking Audit…, Persist review item or audit log., Retrieve reviews for a specific target basket/portfolio/strategy. (+10 more)

### Community 46 - "ReviewService"
Cohesion: 0.16
Nodes (20): get_review_service(), get_target_reviews(), preview_verification(), get, post, Request, REST API routes for AI Review Verification and Testimonials (Ticket #21)., Retrieve or lazily initialize ReviewService from application state. (+12 more)

### Community 47 - "MarketRegimeClassifier"
Cohesion: 0.13
Nodes (15): MarketRegimeClassifier, DataFrame, ndarray, Series, Predict regime labels for a DataFrame of features., Predict regime for a single feature vector., Predict posterior probabilities for each regime class, summing to 1.0., Get descriptive metadata and strategy recommendation for a regime. (+7 more)

### Community 48 - "spacing"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 49 - "generate-slide.py"
Cohesion: 0.14
Nodes (20): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+12 more)

### Community 50 - "TailwindConfigGenerator"
Cohesion: 0.10
Nodes (12): main(), Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Tailwind CSS Configuration Generator Generate tailwind.config.js/ts with custom…, Generate Tailwind CSS configuration files. (+4 more)

### Community 51 - "OnboardingHero.tsx"
Cohesion: 0.19
Nodes (17): HorizonOption, Step2HorizonProps, PersonaCardDef, Step3PersonaProps, SummaryPillsProps, OnboardingHero(), OnboardingHeroProps, calculatePersonaResult() (+9 more)

### Community 52 - "BM25"
Cohesion: 0.16
Nodes (7): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, BM25, BM25

### Community 53 - "detect_domain"
Cohesion: 0.16
Nodes (5): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, Stdlib-only regression tests for core.py / design_system.py (unittest, not…, TestDiagnosticsContracts, TestDomainDetection

### Community 54 - "StrategyType"
Cohesion: 0.16
Nodes (18): BacktestResponse, StrategyType, BacktestService, Any, Core domain service for technical strategy backtesting and quant analytics., Run technical strategy backtest simulation with performance and regime…, backtest_service(), fixture (+10 more)

### Community 55 - "ConversationMemoryManager"
Cohesion: 0.17
Nodes (10): ConversationMemoryManager, MessageTurn, Session-scoped conversation memory for NitiBot., Manages session-scoped conversation history with sliding window and TTL., Format history for Gemini API contents structure (role 'user' and 'model')., Unit tests for NitiBot Session Conversation Memory Manager., test_memory_manager_add_and_retrieve_turns(), test_memory_manager_clear_session() (+2 more)

### Community 56 - "filter_tier1_content"
Cohesion: 0.14
Nodes (18): filter_tier1_content(), Tier 1 Deterministic Rule-Based & Regex Anti-Spam Moderation Filter (Ticket…, Run Tier 1 deterministic checks against review content. Returns: (is_safe,…, Unit tests for Review Verification Tier 1 Deterministic Rules and Anti-Spam…, Verify phone numbers in Indian and international formats are blocked., Verify email addresses are blocked., Verify external URLs, domain links, and link shorteners are blocked., Verify Telegram handles, channels, and invite links are blocked. (+10 more)

### Community 57 - "test_backtest_engine.py"
Cohesion: 0.14
Nodes (19): benchmark_price_series(), DataFrame, fixture, Unit tests for Vectorized Backtest Engine., Bollinger Band breakout/trend strategy executes correctly., Dual momentum compares asset absolute momentum and relative momentum vs…, Generate 200 days of synthetic price data with a clear trend cycle., Higher transaction costs and slippage must strictly decrease final equity. (+11 more)

### Community 58 - "test_hrp_optimizer.py"
Cohesion: 0.14
Nodes (19): DataFrame, fixture, Unit tests for Hierarchical Risk Parity (HRP) Portfolio Optimizer., Ledoit-Wolf shrinkage computes valid positive-definite covariance with…, Generate reproducible sample daily returns for 6 assets., When use_shrinkage=False, returns empirical covariance with shrinkage=0.0., ESG-Conscious persona produces weights that demonstrably favor high-ESG stocks…, HRP weights must sum strictly to 1.0 and all individual weights must be >= 0. (+11 more)

### Community 59 - "fetch-background.py"
Cohesion: 0.16
Nodes (18): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+10 more)

### Community 60 - "color"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 61 - "template.sh"
Cohesion: 0.23
Nodes (17): ask(), ask_secret(), banner(), _clear(), _existing(), finish(), note(), open_url() (+9 more)

### Community 62 - "extract_regime_features"
Cohesion: 0.16
Nodes (17): calculate_parkinson_volatility(), calculate_realized_volatility(), calculate_rolling_log_returns(), extract_regime_features(), DataFrame, Series, Feature engineering for unsupervised market regime detection., Calculate rolling realized volatility of daily log returns. (+9 more)

### Community 63 - "triggerHaptic"
Cohesion: 0.12
Nodes (19): backtestCurrentStock(), clearNitiBotChat(), closeStockProfileModal(), copyGrowwFormat(), copyZerodhaFormat(), dismissIOSInstallBanner(), loadVideoFacade(), openCreatePortfolioModal() (+11 more)

### Community 64 - "triggerHaptic"
Cohesion: 0.12
Nodes (19): backtestCurrentStock(), clearNitiBotChat(), closeStockProfileModal(), copyGrowwFormat(), copyZerodhaFormat(), dismissIOSInstallBanner(), loadVideoFacade(), openCreatePortfolioModal() (+11 more)

### Community 65 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 66 - "logo/core.py"
Cohesion: 0.16
Nodes (16): _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results, _search_csv(), detect_domain() (+8 more)

### Community 67 - "TestThresholdGate"
Cohesion: 0.12
Nodes (4): Unit tests for metric math and relevance fixture validation., TestFixtureValidation, TestMetricMath, TestThresholdGate

### Community 68 - "FastAPI"
Cohesion: 0.12
Nodes (14): FastAPI, health_check(), get, Service health check endpoint., Server-Sent Events (SSE) streaming routes for real-time market data., Market tick streaming and synthetic generation engine., market_service(), fixture (+6 more)

### Community 69 - "renderHomeTab"
Cohesion: 0.24
Nodes (18): activateBasketToPortfolio(), applyRebalance(), checkRebalanceDiff(), closeCreatePortfolioModal(), deleteActivePortfolio(), deletePortfolioFromIndexedDB(), handlePortfolioSwitch(), loadPortfoliosFromIndexedDB() (+10 more)

### Community 70 - "renderHomeTab"
Cohesion: 0.24
Nodes (18): activateBasketToPortfolio(), applyRebalance(), checkRebalanceDiff(), closeCreatePortfolioModal(), deleteActivePortfolio(), deletePortfolioFromIndexedDB(), handlePortfolioSwitch(), loadPortfoliosFromIndexedDB() (+10 more)

### Community 71 - "BM25"
Cohesion: 0.15
Nodes (5): BM25, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, All indexed terms, for suggestion/typo-recovery purposes., TestBm25CoreBehavior, TestTokenizer

### Community 73 - "package.json"
Cohesion: 0.12
Nodes (16): name, private, type, version, autoprefixer, clsx, jsdom, postcss (+8 more)

### Community 74 - "grow.py"
Cohesion: 0.21
Nodes (16): get_grow_service(), get, post, Request, Grow and AI Portfolio Basket recommendation API endpoints., Retrieve GrowService instance from application state., Generate curated AI portfolio basket via POST body., Generate curated AI portfolio basket via GET query params. (+8 more)

### Community 75 - "MarketStreamClient"
Cohesion: 0.14
Nodes (5): marketStream, MarketStreamClient, MarketTick, TickListener, MockEventSource

### Community 76 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 77 - "TestShadcnInstaller"
Cohesion: 0.13
Nodes (9): fixture, Test adding components in dry run mode., Test ShadcnInstaller class., Test adding all components without config., Create temporary project structure., Test listing installed components when they exist., Test checking for non-existent shadcn config., Test getting installed components without config. (+1 more)

### Community 78 - "PortfolioRepository"
Cohesion: 0.13
Nodes (9): PortfolioRepository, Any, Relational persistence repository for QuantNiti Virtual Portfolios., Return list of existing database tables., List all active portfolios in the database., Delete portfolio and all cascading child records., Record an individual transaction entry in the ledger., Retrieve transaction history for a portfolio. (+1 more)

### Community 79 - "renderNotificationList"
Cohesion: 0.17
Nodes (16): clearAllNotifications(), downloadBlob(), downloadPortfolioReportPDF(), filterNotifications(), formatAlertTime(), generatePortfolioReportBlob(), initNotificationCenter(), loadNotifications() (+8 more)

### Community 80 - "renderNotificationList"
Cohesion: 0.17
Nodes (16): clearAllNotifications(), downloadBlob(), downloadPortfolioReportPDF(), filterNotifications(), formatAlertTime(), generatePortfolioReportBlob(), initNotificationCenter(), loadNotifications() (+8 more)

### Community 81 - "list-components.js"
Cohesion: 0.13
Nodes (10): buildRoot, composeComponents, composeModifiers, fs, path, pkgRoot, swiftuiComponents, swiftuiModifiers (+2 more)

### Community 82 - ".generate"
Cohesion: 0.16
Nodes (8): _filter_anti_patterns_for_mode(), Drop "avoid dark mode" advice once dark mode is the resolved answer., Execute searches across multiple domains., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None., _resolve_dial(), TestAntiPatternGating

### Community 83 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, jsdom, postcss, tailwindcss, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event (+7 more)

### Community 84 - "hrp.py"
Cohesion: 0.21
Nodes (13): apply_weight_caps(), compute_hrp_weights(), get_cluster_variance(), get_quasi_diag_order(), ndarray, Hierarchical Risk Parity (HRP) Portfolio Allocation Engine. Implements the…, Perform recursive bisection to compute HRP portfolio weights., Iteratively apply single-asset maximum concentration cap and re-normalize. (+5 more)

### Community 85 - "closeModalSheet"
Cohesion: 0.14
Nodes (15): askNitiBotAboutConcept(), askNitiBotAboutCurrentConcept(), closeCompetitorBenchmarkModal(), closeConceptModal(), closeModalSheet(), closeNitiBotChat(), closeNitiBotModal(), closeOrderSheetModal() (+7 more)

### Community 86 - "closeModalSheet"
Cohesion: 0.14
Nodes (15): askNitiBotAboutConcept(), askNitiBotAboutCurrentConcept(), closeCompetitorBenchmarkModal(), closeConceptModal(), closeModalSheet(), closeNitiBotChat(), closeNitiBotModal(), closeOrderSheetModal() (+7 more)

### Community 87 - "asyncio"
Cohesion: 0.13
Nodes (15): asyncio, Verify Android native physics, haptic feedback, and History API popstate…, Verify Ticket #18 Compounding Visualizer in Home tab & Long-Horizon Hurdle in…, Verify Ticket #19 Multi-Portfolio Switcher, Dual-Metric Hero Card, and Goal…, Verify that the 4 primary bottom navigation tabs exist: Home, Explore, Grow,…, Verify adaptive Home tab elements: Onboarding card, Dual-metric snapshot card,…, Verify that Quant Lab Strategy Backtester is relocated inside the Explore tab…, Verify Groww design tokens, light/dark theme variables, and tabular numbers in… (+7 more)

### Community 88 - "extract-colors.cjs"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 89 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 90 - "radius"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 91 - "backtest.py"
Cohesion: 0.24
Nodes (13): get_backtest_service(), get, post, Request, Quant Lab Technical Strategy Backtesting API endpoints., Alias for /backtest/run to support /quant-lab/backtest routing., Retrieve BacktestService instance from application state., Run technical strategy backtest via POST body. (+5 more)

### Community 92 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, id, name, orientation (+5 more)

### Community 93 - "design-tokens-starter.json"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 94 - "RiskPersona"
Cohesion: 0.22
Nodes (13): RiskPersona, HRPOptimizer, Hierarchical Risk Parity Optimizer configured with Risk Persona profiles., HRP works correctly on minimal 2-asset universe., HRP engine handles collinear assets (correlation ~ 0.9999) gracefully without…, Ledoit-Wolf shrinkage reduces weight variation across small rolling subsamples., Verify all RiskPersona types adhere to strict concentration caps on an 8-asset…, test_hrp_distance_matrix_conditioning_extreme_correlation() (+5 more)

### Community 95 - "._get_file_path"
Cohesion: 0.18
Nodes (7): DataFrame, Path, Derive safe file path for a symbol., Save OHLCV dataframe as a Parquet file., Load cached historical dataframe for a symbol if it exists and satisfies TTL., Check if a symbol has an existing, unexpired cached file., Remove cached data for a specific symbol or all symbols.

### Community 96 - "BacktestEngine"
Cohesion: 0.23
Nodes (10): BacktestEngine, compute_rsi(), Any, DataFrame, Series, Extract individual trade logs from position transitions., Execute vectorized backtest simulation., Compute Relative Strength Index (RSI). (+2 more)

### Community 97 - "escapeHtml"
Cohesion: 0.21
Nodes (13): escapeHtml(), filterLearningCategory(), filterReviewsList(), initLearningHub(), openConceptModal(), renderLearningCards(), renderLearningHub(), renderReviewsList() (+5 more)

### Community 98 - "escapeHtml"
Cohesion: 0.21
Nodes (13): escapeHtml(), filterLearningCategory(), filterReviewsList(), initLearningHub(), openConceptModal(), renderLearningCards(), renderLearningHub(), renderReviewsList() (+5 more)

### Community 99 - "test_portfolio_storage.py"
Cohesion: 0.15
Nodes (12): fixture, Unit tests for SQLite Relational Multi-Portfolio Storage (Ticket #19)., Saving a portfolio persists portfolio record, holdings, transactions, and…, Listing portfolios returns all saved goal portfolios., Deleting a portfolio removes portfolio record, holdings, transactions, and…, Create in-memory SQLite PortfolioRepository., Verify that portfolios, holdings, transactions, and daily_snapshots tables are…, repo() (+4 more)

### Community 100 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 101 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 102 - "generate_viewer.py"
Cohesion: 0.38
Nodes (11): b64_img(), build_page(), load_json(), main(), Generate the self-contained HTML viewer for an expo-skill-eval run. Usage:…, render_config_card(), render_expectations(), render_iteration() (+3 more)

### Community 103 - ".check_shadcn_config"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 104 - ".generate_config_string"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 105 - "_style_is_dark_primary"
Cohesion: 0.21
Nodes (7): _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution

### Community 106 - "Base"
Cohesion: 0.21
Nodes (11): DeclarativeBase, Base, DailySnapshotRecord, HoldingRecord, PortfolioRecord, Relational table storing ledger transactions (BUY, SELL, REBALANCE)., Relational table tracking historical daily mark-to-market snapshots., Persist or update portfolio record, holdings, transactions, and daily snapshot. (+3 more)

### Community 107 - "test_pwa_unit.py"
Cohesion: 0.17
Nodes (11): Unit tests for PWA configuration, manifest schema, and service worker assets., Verify manifest.json exists and adheres to PWA specification., Verify generated icon files exist in static/icons., Verify sw.js service worker implementation., Verify offline.html fallback exists and matches design system., Verify CSS has media query for min-width: 1024px persistent sidebar layout., test_desktop_responsive_css_rules(), test_icon_assets_exist() (+3 more)

### Community 108 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 109 - "embed-tokens.cjs"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 110 - "ShadcnInstaller"
Cohesion: 0.22
Nodes (7): main(), Handle shadcn/ui component installation., shadcn/ui Component Installer Add shadcn/ui components to project with…, ShadcnInstaller, Tests for shadcn_add.py, Test listing installed components without config., Test initialization with default project root.

### Community 111 - "patch"
Cohesion: 0.18
Nodes (6): patch, Test adding components with overwrite flag., Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components.

### Community 112 - "test_tailwind_config_gen.py"
Cohesion: 0.22
Nodes (8): Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs, parametrize

### Community 113 - "test_text_layout_resilience.py"
Cohesion: 0.20
Nodes (4): Canonical regression contracts for resilient UI text layouts., read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval

### Community 114 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, chart.js, clsx, framer-motion, lucide-react, react, react-chartjs-2, react-dom (+3 more)

### Community 115 - "asyncio"
Cohesion: 0.18
Nodes (11): asyncio, POST /api/v1/grow/recommend with ESG-Conscious persona returns valid basket…, POST /api/v1/grow/recommend returns 200 with complete recommendation schema., GET /api/v1/grow/recommend with query parameters returns 200., POST /api/v1/baskets/recommend alias route returns 200., Invalid capital, horizon, or persona returns 422 Unprocessable Entity., test_get_grow_recommend_success(), test_grow_recommend_esg_conscious_api() (+3 more)

### Community 116 - "asyncio"
Cohesion: 0.18
Nodes (11): asyncio, Verify /manifest.json is served with application/manifest+json MIME type and…, Verify /sw.js is served with application/javascript and Service-Worker-Allowed:…, Verify /offline.html is served successfully., Verify icon PNG and SVG assets are accessible via HTTP., Verify index.html includes manifest link, Apple meta tags, install button, and…, test_index_html_contains_pwa_metadata_and_elements(), test_manifest_endpoint_served_with_correct_mime() (+3 more)

### Community 117 - "asyncio"
Cohesion: 0.18
Nodes (11): asyncio, Verify styles.css includes fixed-width layout (794px), watermark, and report…, Verify app.js contains report card population, PDF/image blob generation,…, Verify index.html contains CDN script tags for html2canvas and jspdf., Verify index.html contains Download Report and Share buttons on Portfolio and…, Verify index.html contains hidden fixed-width report card template with all 8…, test_app_js_contains_report_export_and_share_functions(), test_html_contains_download_and_share_buttons() (+3 more)

### Community 118 - "test_basket_growth_calculator.py"
Cohesion: 0.18
Nodes (10): mock_stock_forecasts(), fixture, Unit tests for Basket Growth, Drawdown & Trust Card Calculator., Benchmark comparisons must compare AI Basket, NIFTY 50, and 7% Bank FD., Create deterministic forecast cones for test stocks., Growth projections must satisfy Pessimistic <= Base <= Optimistic., Trust Card must contain all 4 explainability pillars., test_build_benchmark_comparisons() (+2 more)

### Community 119 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 120 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 121 - "duration"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 122 - "._base_config"
Cohesion: 0.22
Nodes (6): Any, Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework.

### Community 123 - "compute_regime_suitability"
Cohesion: 0.33
Nodes (8): RegimeSuitability, compute_regime_suitability(), Any, Regime-conditioned stock suitability scoring and intelligence badge generator., Evaluate asset characteristics against the active market regime. Computes a…, test_suitability_in_bear_regime(), test_suitability_in_bull_regime(), test_suitability_score_bounds()

### Community 124 - "test_chat_api.py"
Cohesion: 0.27
Nodes (7): MockGeminiAdapter, asyncio, Integration tests for NitiBot Chat API endpoints., test_chat_endpoint_graceful_degradation_503(), test_chat_endpoint_success(), test_chat_status_endpoint(), test_chat_status_endpoint_when_disabled()

### Community 125 - "test_client_serving.py"
Cohesion: 0.29
Nodes (9): asyncio, Integration tests for Client Serving endpoints and static assets., Verify that Vite build artifacts in /static/dist and /vite endpoint are served., Verify that the in-app competitor benchmark drawer, triggers, and 10 dimensions…, test_app_route_serves_html(), test_competitor_benchmark_drawer_served(), test_root_serves_html(), test_static_assets_served() (+1 more)

### Community 126 - "test_review_verification_agent.py"
Cohesion: 0.20
Nodes (9): agent(), fixture, Unit tests for ReviewVerificationAgent full 3-tier pipeline (Ticket #21)., Verify authentic review within tolerance receives VERIFIED status and badge., Verify spam with phone number is blocked at Tier 1 before checking ground truth., Verify exaggerated claims (+45% in 1 month vs 12.5% actual) are rejected at…, test_agent_approves_and_verifies_authentic_review(), test_agent_blocks_tier1_spam_immediately() (+1 more)

### Community 127 - "sync-brand-to-tokens.cjs"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 128 - "render-html.py"
Cohesion: 0.31
Nodes (8): generate_html(), get_deliverable_info(), get_image_base64(), main(), Convert image to base64 for embedding in HTML, Extract deliverable type from filename and get info, Generate HTML presentation from CIP images, CIP HTML Presentation Renderer Generates a professional HTML presentation from…

### Community 129 - "_run"
Cohesion: 0.28
Nodes (8): Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), CompletedProcess

### Community 130 - "_normalize"
Cohesion: 0.25
Nodes (9): _exact_match_diagnostic(), _legacy_successor_guidance(), _normalize(), Apply longest-first synonym substitution at token boundaries., Whether a stack query explicitly targets an older framework generation., Choose one coherent applicability generation for stack retrieval., Prefer the explicit successor row for a brand-new app on legacy-only stacks., _stack_query_requests_legacy() (+1 more)

### Community 131 - "compute_shrunk_covariance"
Cohesion: 0.25
Nodes (8): compute_shrunk_covariance(), DataFrame, Compute regularized covariance matrix with Ledoit-Wolf shrinkage and automated…, Optimize portfolio allocation across assets in returns_df., Fallback to regularized empirical covariance on rank-deficient / constant…, test_compute_shrunk_covariance_fallback_on_degenerate_data(), Covariance computation with Ledoit-Wolf shrinkage succeeds on multi-asset…, test_ledoit_wolf_covariance_on_multi_asset_matrix()

### Community 132 - "test_api_routes.py"
Cohesion: 0.39
Nodes (8): asyncio, test_get_history_endpoint(), test_get_quote_endpoint(), test_get_returns_matrix_endpoint(), test_get_universe_endpoint(), test_get_universe_filtered_by_sector(), test_health_endpoint(), test_sync_endpoint()

### Community 133 - "asyncio"
Cohesion: 0.22
Nodes (9): asyncio, POST /api/v1/backtest/run executes backtest simulation successfully., GET /api/v1/backtest/run with query parameters returns 200., POST /api/v1/quant-lab/backtest alias route returns 200., Invalid capital, invalid strategy or unknown symbol returns error codes., test_backtest_validation_errors(), test_get_backtest_run_success(), test_post_backtest_run_success() (+1 more)

### Community 134 - "asyncio"
Cohesion: 0.22
Nodes (9): asyncio, POST /api/v1/portfolio/compounding with active portfolio_id links active…, Invalid parameters return HTTP 422., POST /api/v1/portfolio/compounding returns exact compounding calculations and…, Ensure both /api/v1/portfolio/compounding and /api/portfolio/compounding…, test_compounding_endpoint_mounted_at_both_prefixes(), test_compounding_endpoint_standalone_post(), test_compounding_endpoint_validation_errors() (+1 more)

### Community 135 - "asyncio"
Cohesion: 0.22
Nodes (9): asyncio, End-to-End Journey 2: 1. Search & Filter stocks in Explore Tab. 2. Retrieve…, End-to-End Journey 3: Verifies that all 5 technical trading strategies…, End-to-End Journey 4: Verifies Market Regime radar and historical timeline…, End-to-End Journey 1: 1. Check Market Regime. 2. Generate AI Basket…, test_e2e_explore_stock_to_quant_lab_backtest_journey(), test_e2e_grow_basket_to_virtual_portfolio_lifecycle(), test_e2e_quant_lab_multi_strategy_suite() (+1 more)

### Community 136 - "test_explore_api.py"
Cohesion: 0.39
Nodes (8): asyncio, test_explore_stocks_contain_esg_fields(), test_get_explore_stocks_filtered(), test_get_explore_stocks_route(), test_get_growth_forecast_route(), test_get_stock_profile_route(), test_get_ticker_esg_endpoint(), test_stock_profile_contains_esg()

### Community 137 - "asyncio"
Cohesion: 0.22
Nodes (9): asyncio, Verify DELETE /api/v1/portfolios/{id} removes the portfolio., Verify endpoints resolve on both /api/v1 and /api prefixes., Verify creating distinct named goal portfolios and listing them., Verify GET /api/v1/portfolios/{id} calculates day-over-day MTM and separates 1D…, test_create_and_list_multiple_portfolios(), test_delete_portfolio_lifecycle(), test_dual_prefix_routing_portfolios() (+1 more)

### Community 138 - "asyncio"
Cohesion: 0.22
Nodes (9): asyncio, Verify GET /api/v1/reviews/{target_type}/{target_id} returns review list and…, Verify POST /api/v1/reviews/submit approves authentic return claim within…, Verify POST /api/v1/reviews/submit rejects exaggerated return claim., Verify POST /api/v1/reviews/submit blocks prohibited contact solicitations., test_get_reviews_endpoint(), test_submit_exaggerated_review_rejected(), test_submit_prohibited_spam_rejected() (+1 more)

### Community 139 - "asyncio"
Cohesion: 0.22
Nodes (9): asyncio, Verify index.html contains notification bell button, drawer, and toast…, Verify styles.css includes .tick-up, .tick-down flash animations and drawer…, Verify sw.js contains push and notificationclick event listeners., Verify app.js contains MarketStreamClient implementation with EventSource…, test_app_js_contains_market_stream_client(), test_html_contains_notification_bell_drawer_and_toasts(), test_service_worker_push_event_listeners() (+1 more)

### Community 140 - "base_portfolio"
Cohesion: 0.22
Nodes (8): base_portfolio(), fixture, Unit tests for Day-over-Day Mark-to-Market (MTM) calculations (Ticket #19)., Aggregate 1D P&L is the sum of holding 1D P&Ls: Delta V_{1D} = sum Delta V_{i,…, Create a baseline portfolio with 2 holdings., Holding 1D P&L must equal N_i * (P_{i, t} - P_{i, t-1}). RELIANCE: 10 shares,…, test_aggregate_portfolio_day_over_day_mtm(), test_holding_day_over_day_mtm_formula()

### Community 141 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 142 - "fetch.js"
Cohesion: 0.43
Nodes (7): CACHE_DIRECTORY, fetchCached(), getExpires(), hashUrl(), loadCacheEntry(), parseMaxAge(), saveCacheEntry()

### Community 143 - "_row_identities"
Cohesion: 0.25
Nodes (8): _exact_row_identity(), Suggest complete public identities so a retry can bypass score thresholds., Return non-empty public identities from ordinary and alias fields., Resolve an explicit style identity without opening generic variant ranking., Return one row whose stable public identity exactly matches the query., _row_identities(), _style_identity(), _suggest_identities()

### Community 144 - "test_literacy_api.py"
Cohesion: 0.39
Nodes (7): asyncio, Integration tests for Financial Literacy Microlearning REST API endpoints., test_dual_routing_api_prefix(), test_get_all_literacy_cards_category_filter(), test_get_all_literacy_cards_v1(), test_get_literacy_card_by_unknown_key_returns_404(), test_get_literacy_card_by_valid_key()

### Community 145 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 148 - "asyncio"
Cohesion: 0.29
Nodes (7): asyncio, Verify index.html contains Community Reviews section and Write Review modal., Verify styles.css includes review cards, verified badge, and star rating…, Verify app.js contains review loading, modal toggling, and review submission…, test_app_js_contains_review_management_functions(), test_html_contains_review_section_and_modal(), test_styles_contain_review_and_badge_classes()

### Community 149 - "test_cache.py"
Cohesion: 0.33
Nodes (6): fixture, sample_df(), temp_cache_dir(), test_cache_invalidation(), test_cache_save_and_load(), test_cache_ttl_expiration()

### Community 150 - "snapshot-android.sh"
Cohesion: 0.53
Nodes (4): emulator_alive(), find_sdk_tool(), log_step(), snapshot-android.sh script

### Community 151 - "test_report_card.py"
Cohesion: 0.33
Nodes (5): Unit tests for Sharable Portfolio Report Card generation and Web Share API…, Verify app.js contains valid JavaScript declaring the required functions., Execute headless verification of report Blob generation and Web Share logic…, test_app_js_exports_report_functions(), test_report_blob_generation_and_share_flow_headless()

### Community 152 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 153 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 154 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 155 - "sm"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 156 - "scripts/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 157 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

### Community 159 - "get_current_regime"
Cohesion: 0.40
Nodes (5): get_current_regime(), get_regime_history(), get, Retrieve active macroeconomic market regime, confidence, and class…, Retrieve historical market regime classification timeline and overall regime…

### Community 162 - "test_portfolio_full_lifecycle_api"
Cohesion: 0.40
Nodes (5): asyncio, Test portfolio creation, retrieval, rebalance diff, rebalance application, and…, Requesting nonexistent portfolio ID returns 404., test_portfolio_full_lifecycle_api(), test_portfolio_not_found_errors()

### Community 163 - "slide-token-validator.py"
Cohesion: 0.50
Nodes (3): main(), Slide Token Validator (Legacy Wrapper) Now delegates to html-token-validator.py…, Delegate to unified html-token-validator.py with --type slides.

### Community 164 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 165 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 166 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 167 - "hitl-loop.template.sh"
Cohesion: 0.83
Nodes (3): capture(), hitl-loop.template.sh script, step()

### Community 170 - "16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 171 - "1"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 172 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 173 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 174 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 175 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 176 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 177 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 178 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 179 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

## Knowledge Gaps
- **320 isolated node(s):** `DemoPortfolioProps`, `BenchmarkComparison`, `CompoundingYearlyPoint`, `RebalanceBannerProps`, `GlassCardProps` (+315 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1303 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MarketDataService` connect `MarketDataService` to `models.py`, `forecasting/service.py`, `data/service.py`, `FastAPI`, `compute_shrunk_covariance`, `validate_ohlcv_dataframe`, `test_multi_asset_universe.py`, `SmartAlertType`, `market.py`, `StrategyType`, `RiskPersona`, `MarketTickGenerator`, `simulation/service.py`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `RegimeService` connect `MarketDataService` to `models.py`, `forecasting/service.py`, `data/service.py`, `NitiBotService`, `SmartAlertType`, `MarketRegimeType`, `MarketRegimeClassifier`, `StrategyType`, `simulation/service.py`, `get_current_regime`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `search()` connect `search` to `logo/core.py`, `scripts/core.py`, `_normalize`, `test_core_data_quality.py`, `_row_identities`, `design_system.py`, `test_text_layout_resilience.py`, `.generate`, `detect_domain`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 55 inferred relationships involving `MarketDataService` (e.g. with `get_history()` and `get_market_service()`) actually correct?**
  _`MarketDataService` has 55 INFERRED edges - model-reasoned connections that need verification._
- **Are the 38 inferred relationships involving `MarketRegimeType` (e.g. with `PortfolioRepository` and `evaluate_regime_transition()`) actually correct?**
  _`MarketRegimeType` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DemoPortfolioProps`, `BenchmarkComparison`, `CompoundingYearlyPoint` to the rest of the system?**
  _320 weakly-connected nodes found - possible documentation gaps or missing edges._