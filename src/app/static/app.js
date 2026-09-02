/**
 * QuantNiti - Modern Financial Mobile-First Single-Page Client Application
 * Groww-Inspired Redesign & 4-Tab Navigation (Home, Explore, Grow, Portfolio)
 */

// Application State Store
const AppState = {
  activeTab: "home",
  theme: "dark",
  capital: 50000,
  horizon: "6M",
  riskPersona: "Balanced",
  activeRegime: null,
  currentBasket: null,
  activePortfolioId: null,
  activePortfolio: null,
  portfolios: [],
  allExploreStocks: [],
  selectedStockSymbol: null,
  activeBacktest: null,
  nitibotSessionId: "session_" + Math.random().toString(36).substring(2, 10),
  charts: {},
};

// Deferred PWA install prompt holder
let deferredPWAInstallPrompt = null;

// ===================================================================
// ANDROID NATIVE TOUCH PHYSICS & HAPTIC FEEDBACK
// ===================================================================

function triggerHaptic(duration = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(duration);
    } catch (e) {
      // Vibration not permitted or supported
    }
  }
}

// History API popstate handling for modal sheet dismissal
window.addEventListener("popstate", (event) => {
  // Dismiss any open modal on Android back gesture or browser back
  closeAllModals(false);
});

function closeAllModals(triggerHistory = true) {
  const modalIds = [
    "stockProfileModal",
    "orderSheetModal",
    "competitorBenchmarkModal",
    "nitibotModal",
  ];
  let hadOpen = false;
  modalIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el && (el.classList.contains("active") || !el.classList.contains("hidden"))) {
      el.classList.remove("active");
      if (id === "nitibotModal") {
        el.classList.add("hidden");
      }
      hadOpen = true;
    }
  });

  if (hadOpen && triggerHistory && window.history.state && window.history.state.modalOpen) {
    try {
      history.back();
    } catch (e) {}
  }
}

function openModalSheet(modalId) {
  triggerHaptic(15);
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("active");
  try {
    history.pushState({ modalOpen: modalId }, "");
  } catch (e) {}
}

function closeModalSheet(modalId) {
  triggerHaptic(10);
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("active");
  if (modalId === "nitibotModal") {
    modal.classList.add("hidden");
  }
  if (window.history.state && window.history.state.modalOpen === modalId) {
    try {
      history.back();
    } catch (e) {}
  }
}

// ===================================================================
// THEME MANAGEMENT (GROWW MINT + NEUTRAL DARK / LIGHT THEMES)
// ===================================================================

function initTheme() {
  const savedTheme = localStorage.getItem("quantniti_theme") || "dark";
  setTheme(savedTheme);
}

function setTheme(theme) {
  AppState.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("quantniti_theme", theme);
  
  const icon = document.getElementById("themeToggleIcon");
  if (icon) {
    if (theme === "dark") {
      icon.setAttribute("data-lucide", "sun");
      icon.className = "w-4 h-4 text-amber-400";
    } else {
      icon.setAttribute("data-lucide", "moon");
      icon.className = "w-4 h-4 text-slate-700";
    }
    if (window.lucide) lucide.createIcons();
  }
}

function toggleTheme() {
  triggerHaptic(15);
  const nextTheme = AppState.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
}

// ===================================================================
// APPLICATION LIFECYCLE & INITIALIZATION
// ===================================================================

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  if (window.lucide) {
    lucide.createIcons();
  }
  registerServiceWorker();
  checkIOSInstallGuidance();
  await checkNitiBotStatus();
  await fetchCurrentRegime();
  await loadExploreStocks();
  // Pre-generate a default basket for instant preview
  await generateBasket();
  renderHomeTab();
});

// PWA & SERVICE WORKER LIFECYCLE CONTROLLER
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("QuantNiti ServiceWorker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("QuantNiti ServiceWorker registration notice:", err);
        });
    });
  }
}

// Intercept beforeinstallprompt for Custom Branded Install Button
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPWAInstallPrompt = e;
  const installBtn = document.getElementById("pwaInstallBtn");
  if (installBtn) {
    installBtn.classList.remove("hidden");
  }
});

async function promptPWAInstall() {
  triggerHaptic(20);
  if (!deferredPWAInstallPrompt) return;
  deferredPWAInstallPrompt.prompt();
  const { outcome } = await deferredPWAInstallPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
  deferredPWAInstallPrompt = null;
  const installBtn = document.getElementById("pwaInstallBtn");
  if (installBtn) {
    installBtn.classList.add("hidden");
  }
}

window.addEventListener("appinstalled", () => {
  deferredPWAInstallPrompt = null;
  const installBtn = document.getElementById("pwaInstallBtn");
  if (installBtn) {
    installBtn.classList.add("hidden");
  }
  console.log("QuantNiti PWA was successfully installed.");
});

// iOS Safari Guidance: In-App Dismissible Banner
function checkIOSInstallGuidance() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  const isDismissed = localStorage.getItem("quantniti_ios_pwa_dismissed") === "true";

  if (isIOS && !isStandalone && !isDismissed) {
    const banner = document.getElementById("iosInstallBanner");
    if (banner) {
      banner.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    }
  }
}

function dismissIOSInstallBanner() {
  triggerHaptic(10);
  const banner = document.getElementById("iosInstallBanner");
  if (banner) {
    banner.classList.add("hidden");
  }
  localStorage.setItem("quantniti_ios_pwa_dismissed", "true");
}

// ===================================================================
// 4-TAB NAVIGATION CONTROLLER (Home, Explore, Grow, Portfolio)
// ===================================================================

function switchTab(tabId) {
  triggerHaptic(12);
  AppState.activeTab = tabId;
  
  // Update Tab Panel visibility
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active");
  });
  const targetPanel = document.getElementById(`tab-${tabId}`);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  // Update Bottom Nav active button
  document.querySelectorAll(".nav-tab-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-tab") === tabId) {
      btn.classList.add("active");
    }
  });

  // Re-render icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Trigger tab-specific loaders
  if (tabId === "home") {
    renderHomeTab();
  } else if (tabId === "portfolio") {
    if (AppState.activePortfolioId) {
      refreshPortfolioView();
    }
  }
}

// Toggle Responsive Layout Mode (Mobile Frame vs Expanded Desktop)
function toggleViewportMode() {
  triggerHaptic(10);
  const container = document.getElementById("appContainer");
  const isExpanded = container.classList.toggle("expanded-mode");
  const btn = document.getElementById("viewToggleBtn");
  btn.innerHTML = isExpanded 
    ? '<i data-lucide="minimize-2" class="w-4 h-4"></i>'
    : '<i data-lucide="maximize-2" class="w-4 h-4"></i>';
  if (window.lucide) lucide.createIcons();
}

// ===================================================================
// TAB 1: ADAPTIVE HOME TAB CONTROLLER
// ===================================================================

function renderHomeTab() {
  // 1. Adaptive Onboarding vs Portfolio Snapshot
  const onboardingCard = document.getElementById("onboardingCard");
  const snapshotCard = document.getElementById("homePortfolioSnapshotCard");

  if (AppState.activePortfolio) {
    if (onboardingCard) onboardingCard.classList.add("hidden");
    if (snapshotCard) {
      snapshotCard.classList.remove("hidden");
      const port = AppState.activePortfolio;
      
      // Dual metrics: 1D P&L and Overall P&L
      const pnl1d = document.getElementById("homePort1DPnl");
      const pnlOverall = document.getElementById("homePortOverallPnl");
      const totalVal = document.getElementById("homePortTotalVal");
      const alpha = document.getElementById("homePortAlpha");

      if (pnl1d) {
        let dayPnl = 0;
        port.holdings.forEach((h) => {
          const s = AppState.allExploreStocks.find((stk) => stk.symbol === h.symbol);
          if (s && typeof s.day_change_pct === "number") {
            const prevPrice = s.current_price / (1 + s.day_change_pct / 100);
            dayPnl += (s.current_price - prevPrice) * h.shares;
          }
        });
        const dayPnlPct = port.current_value > 0 ? (dayPnl / port.current_value) * 100 : 0;
        const isPos = dayPnl >= 0;
        pnl1d.innerText = `${isPos ? '+' : ''}₹${dayPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${dayPnlPct.toFixed(1)}%)`;
        pnl1d.className = `text-base font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'} mt-0.5 tabular-nums`;
      }
      if (pnlOverall) {
        const isPos = port.total_pnl >= 0;
        pnlOverall.innerText = `${isPos ? '+' : ''}₹${port.total_pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${port.total_pnl_pct.toFixed(1)}%)`;
        pnlOverall.className = `text-base font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'} mt-0.5 tabular-nums`;
      }
      if (totalVal) {
        totalVal.innerText = `₹${port.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      }
      if (alpha && port.benchmark_comparison) {
        const a = port.benchmark_comparison.alpha_vs_nifty;
        alpha.innerText = `${a >= 0 ? '+' : ''}${a.toFixed(1)}%`;
        alpha.className = `font-bold ${a >= 0 ? 'text-emerald-400' : 'text-rose-400'} tabular-nums`;
      }
    }
  } else {
    if (onboardingCard) onboardingCard.classList.remove("hidden");
    if (snapshotCard) snapshotCard.classList.add("hidden");
  }

  // 2. Curated Recommendations Preview List
  renderHomeTopPicks();
}

function renderHomeTopPicks() {
  const list = document.getElementById("homeTopPicksList");
  if (!list) return;

  if (!AppState.allExploreStocks || !AppState.allExploreStocks.length) {
    list.innerHTML = `<div class="text-xs text-slate-500 py-3 text-center">Loading top picks...</div>`;
    return;
  }

  // Select top 3 regime picks
  const topPicks = [...AppState.allExploreStocks]
    .sort((a, b) => (b.growth_6m_base_pct || 0) - (a.growth_6m_base_pct || 0))
    .slice(0, 3);

  list.innerHTML = topPicks.map((s) => `
    <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/40 cursor-pointer transition-all" onclick="openStockProfileModal('${s.symbol}')">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
          ${s.symbol.slice(0, 3)}
        </div>
        <div>
          <div class="text-xs font-bold text-white">${s.symbol}</div>
          <div class="text-[10px] text-slate-400">${s.sector}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs font-bold text-white tabular-nums">₹${s.current_price.toFixed(1)}</div>
        <div class="text-[10px] font-semibold text-emerald-400 tabular-nums">+${s.growth_6m_base_pct.toFixed(1)}% (6M)</div>
      </div>
    </div>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

// ===================================================================
// TAB 2: EXPLORE TAB & COLLAPSIBLE QUANT LAB DRAWER
// ===================================================================

function toggleAdvancedAnalysisDrawer(forceOpen) {
  triggerHaptic(10);
  const drawer = document.getElementById("advancedAnalysisDrawer");
  if (!drawer) return;
  if (typeof forceOpen === "boolean") {
    drawer.classList.toggle("open", forceOpen);
  } else {
    drawer.classList.toggle("open");
  }
}

async function loadExploreStocks() {
  try {
    const resp = await fetch("/api/explore/stocks");
    if (!resp.ok) return;
    const stocks = await resp.json();
    AppState.allExploreStocks = stocks;
    renderExploreStockGrid(stocks);
    renderHomeTopPicks();
  } catch (err) {
    console.error("Error loading explore stocks:", err);
  }
}

function filterBySector(sector) {
  triggerHaptic(8);
  document.querySelectorAll("#sectorFilterChips .chip-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-sector") === sector);
  });
  filterStocks();
}

function filterStocks() {
  const query = document.getElementById("stockSearchInput").value.toLowerCase().trim();
  const activeSectorBtn = document.querySelector("#sectorFilterChips .chip-btn.active");
  const sector = activeSectorBtn ? activeSectorBtn.getAttribute("data-sector") : "";

  let filtered = AppState.allExploreStocks;
  if (sector) {
    filtered = filtered.filter((s) => s.sector === sector);
  }
  if (query) {
    filtered = filtered.filter((s) => 
      s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
    );
  }
  renderExploreStockGrid(filtered);
}

function renderExploreStockGrid(stocks) {
  const grid = document.getElementById("exploreStockGrid");
  if (!grid) return;
  if (!stocks.length) {
    grid.innerHTML = `<div class="col-span-2 text-center py-8 text-xs text-slate-500">No stocks matching your criteria</div>`;
    return;
  }

  grid.innerHTML = stocks.map((stock) => `
    <div class="glass-card-sm cursor-pointer hover:border-emerald-500/40 transition-all" onclick="openStockProfileModal('${stock.symbol}')">
      <div class="flex justify-between items-start mb-2">
        <div>
          <span class="font-bold text-white text-sm">${stock.symbol}</span>
          <span class="text-[10px] text-slate-400 block">${stock.sector}</span>
        </div>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          ${stock.regime_badge}
        </span>
      </div>
      <div class="flex justify-between items-end mt-2">
        <div>
          <span class="text-xs font-semibold text-white tabular-nums">₹${stock.current_price.toFixed(1)}</span>
          <span class="text-[10px] ${stock.day_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'} block tabular-nums">
            ${stock.day_change_pct >= 0 ? '+' : ''}${stock.day_change_pct.toFixed(2)}%
          </span>
        </div>
        <div class="text-right">
          <span class="text-[10px] text-slate-500 block">6M Expected</span>
          <span class="text-xs font-bold text-emerald-400 tabular-nums">+${stock.growth_6m_base_pct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  `).join("");
}

async function openStockProfileModal(symbol) {
  AppState.selectedStockSymbol = symbol;
  openModalSheet("stockProfileModal");

  try {
    const resp = await fetch(`/api/explore/profile/${symbol}`);
    if (!resp.ok) return;
    const profile = await resp.json();

    document.getElementById("modalStockSymbol").innerText = profile.symbol;
    document.getElementById("modalStockName").innerText = `${profile.name} • ${profile.sector}`;
    document.getElementById("modalStockPrice").innerText = `₹${profile.current_price.toFixed(2)}`;
    
    const changeEl = document.getElementById("modalStockChange");
    changeEl.innerText = `${profile.day_change_pct >= 0 ? '+' : ''}${profile.day_change_pct.toFixed(2)}%`;
    changeEl.className = `text-xs font-semibold ${profile.day_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'} tabular-nums`;

    renderForecastConesChart(profile.forecast);

    // Factors Grid
    const f = profile.factors;
    document.getElementById("stockFactorsGrid").innerHTML = `
      <div class="glass-card-sm">
        <div class="text-[10px] text-slate-400 uppercase font-medium">RSI (14)</div>
        <div class="text-xs font-bold text-white tabular-nums">${f.rsi_14.toFixed(1)}</div>
      </div>
      <div class="glass-card-sm">
        <div class="text-[10px] text-slate-400 uppercase font-medium">Annualized Alpha</div>
        <div class="text-xs font-bold text-emerald-400 tabular-nums">+${(f.alpha_annualized * 100).toFixed(1)}%</div>
      </div>
      <div class="glass-card-sm">
        <div class="text-[10px] text-slate-400 uppercase font-medium">Market Beta</div>
        <div class="text-xs font-bold text-white tabular-nums">${f.beta.toFixed(2)}</div>
      </div>
      <div class="glass-card-sm">
        <div class="text-[10px] text-slate-400 uppercase font-medium">Regime Score</div>
        <div class="text-xs font-bold text-emerald-400 tabular-nums">${profile.suitability.score.toFixed(0)}/100</div>
      </div>
    `;
  } catch (err) {
    console.error("Error opening profile:", err);
  }
}

function closeStockProfileModal(event) {
  if (event) event.stopPropagation();
  closeModalSheet("stockProfileModal");
}

function renderForecastConesChart(forecast) {
  const ctx = document.getElementById("stockForecastChart").getContext("2d");
  if (AppState.charts.forecastCone) {
    AppState.charts.forecastCone.destroy();
  }

  const horizons = ["Current", "1M", "3M", "6M", "12M"];
  const current = forecast.current_price;
  const opt = [current, forecast.m1.optimistic_price, forecast.m3.optimistic_price, forecast.m6.optimistic_price, forecast.m12.optimistic_price];
  const base = [current, forecast.m1.base_price, forecast.m3.base_price, forecast.m6.base_price, forecast.m12.base_price];
  const pess = [current, forecast.m1.pessimistic_price, forecast.m3.pessimistic_price, forecast.m6.pessimistic_price, forecast.m12.pessimistic_price];

  AppState.charts.forecastCone = new Chart(ctx, {
    type: "line",
    data: {
      labels: horizons,
      datasets: [
        {
          label: "Optimistic (Q90)",
          data: opt,
          borderColor: "#00D09C",
          backgroundColor: "rgba(0, 208, 156, 0.12)",
          fill: "+1",
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: "Base Case (Q50)",
          data: base,
          borderColor: "#3b82f6",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: "Pessimistic (Q10)",
          data: pess,
          borderColor: "#EB5B3C",
          backgroundColor: "rgba(235, 91, 60, 0.12)",
          fill: "-1",
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`,
          },
        },
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } },
        y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } },
      },
    },
  });
}

function backtestCurrentStock() {
  triggerHaptic(15);
  if (!AppState.selectedStockSymbol) return;
  closeStockProfileModal();
  
  // Switch to Explore tab, open the Advanced Analysis drawer, select stock, and run
  switchTab("explore");
  toggleAdvancedAnalysisDrawer(true);
  
  const select = document.getElementById("backtestSymbolSelect");
  if (select) {
    select.value = AppState.selectedStockSymbol;
  }
  const drawer = document.getElementById("advancedAnalysisDrawer");
  if (drawer) {
    drawer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  runBacktest();
}

// ===================================================================
// MARKET REGIME RADAR & BACKTEST ENGINE
// ===================================================================

async function fetchCurrentRegime() {
  try {
    const resp = await fetch("/api/regime/current");
    if (!resp.ok) return;
    const data = await resp.json();
    AppState.activeRegime = data;

    // Header Badge
    const headerText = document.getElementById("headerRegimeText");
    const headerBadge = document.getElementById("headerRegimeBadge");
    if (headerText && headerBadge) {
      headerText.innerText = data.regime;
      headerBadge.className = `regime-pill-badge ${getRegimeClass(data.regime)} cursor-pointer`;
    }

    // Home Radar Badge & Description
    const radarBadge = document.getElementById("radarRegimeBadge");
    const radarDesc = document.getElementById("radarDescription");
    if (radarBadge) {
      radarBadge.innerText = `${data.regime} (${(data.confidence * 100).toFixed(0)}%)`;
      radarBadge.className = `regime-pill-badge ${getRegimeClass(data.regime)}`;
    }
    if (radarDesc) {
      radarDesc.innerText = data.description || "Market exhibits macro stability and healthy factor dispersion.";
    }

    // Probability Bars
    if (data.probabilities) {
      const bull = Math.round((data.probabilities.bull || 0.72) * 100);
      const side = Math.round((data.probabilities.sideways || 0.18) * 100);
      const bear = Math.round((data.probabilities.bear || 0.10) * 100);

      const bullBar = document.getElementById("radarBullBar");
      const sideBar = document.getElementById("radarSidewaysBar");
      const bearBar = document.getElementById("radarBearBar");
      if (bullBar) bullBar.style.width = `${bull}%`;
      if (sideBar) sideBar.style.width = `${side}%`;
      if (bearBar) bearBar.style.width = `${bear}%`;

      const bullProb = document.getElementById("radarBullProb");
      const sideProb = document.getElementById("radarSidewaysProb");
      const bearProb = document.getElementById("radarBearProb");
      if (bullProb) bullProb.innerText = `${bull}%`;
      if (sideProb) sideProb.innerText = `${side}%`;
      if (bearProb) bearProb.innerText = `${bear}%`;
    }
  } catch (err) {
    console.error("Error fetching current regime:", err);
  }
}

function getRegimeClass(regime) {
  if (regime.includes("Bull")) return "regime-bull";
  if (regime.includes("Bear")) return "regime-bear";
  return "regime-sideways";
}

async function runBacktest() {
  triggerHaptic(15);
  const btn = document.getElementById("runBacktestBtn");
  const card = document.getElementById("backtestResultCard");
  btn.disabled = true;

  try {
    const symbol = document.getElementById("backtestSymbolSelect").value;
    const strategy = document.getElementById("backtestStrategySelect").value;
    const capital = parseFloat(document.getElementById("backtestCapitalInput").value) || 100000;
    const cost = parseFloat(document.getElementById("backtestCostInput").value) || 5;
    const slippage = parseFloat(document.getElementById("backtestSlippageInput").value) || 5;

    const resp = await fetch("/api/backtest/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        strategy,
        initial_capital: capital,
        cost_bps: cost,
        slippage_bps: slippage,
      }),
    });

    if (!resp.ok) throw new Error("Backtest failed");
    const data = await resp.json();
    AppState.activeBacktest = data;

    renderBacktestResults(data);
    card.classList.remove("hidden");
  } catch (err) {
    console.error("Backtest error:", err);
  } finally {
    btn.disabled = false;
  }
}

function renderBacktestResults(bt) {
  document.getElementById("btResultTitle").innerText = `${bt.symbol} • ${bt.strategy}`;
  document.getElementById("btResultSubtitle").innerText = `Vectorized backtest: ₹${bt.initial_capital.toLocaleString('en-IN')} → ₹${bt.metrics.final_equity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const m = bt.metrics;
  const grid = document.getElementById("btMetricsGrid");
  grid.innerHTML = `
    <div class="glass-card-sm p-2 text-center">
      <div class="text-[9px] text-slate-400 uppercase">CAGR</div>
      <div class="text-xs font-bold ${m.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'} tabular-nums">${m.cagr.toFixed(1)}%</div>
    </div>
    <div class="glass-card-sm p-2 text-center">
      <div class="text-[9px] text-slate-400 uppercase">Sharpe</div>
      <div class="text-xs font-bold text-white tabular-nums">${m.sharpe_ratio.toFixed(2)}</div>
    </div>
    <div class="glass-card-sm p-2 text-center">
      <div class="text-[9px] text-slate-400 uppercase">Sortino</div>
      <div class="text-xs font-bold text-white tabular-nums">${m.sortino_ratio.toFixed(2)}</div>
    </div>
    <div class="glass-card-sm p-2 text-center">
      <div class="text-[9px] text-slate-400 uppercase">Max DD</div>
      <div class="text-xs font-bold text-rose-400 tabular-nums">${m.max_drawdown_pct.toFixed(1)}%</div>
    </div>
    <div class="glass-card-sm p-2 text-center">
      <div class="text-[9px] text-slate-400 uppercase">Alpha</div>
      <div class="text-xs font-bold ${m.alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'} tabular-nums">${(m.alpha * 100).toFixed(1)}%</div>
    </div>
    <div class="glass-card-sm p-2 text-center">
      <div class="text-[9px] text-slate-400 uppercase">Trades</div>
      <div class="text-xs font-bold text-slate-200 tabular-nums">${m.total_trades}</div>
    </div>
  `;

  renderBacktestEquityChart(bt.equity_curve);
  renderBacktestDrawdownChart(bt.equity_curve);

  const tbody = document.querySelector("#btRegimeTable tbody");
  tbody.innerHTML = bt.regime_breakdown.map((r) => `
    <tr>
      <td class="font-bold text-white">${r.regime}</td>
      <td class="text-slate-300 tabular-nums">${r.days}d</td>
      <td class="${r.strategy_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold tabular-nums">
        ${r.strategy_return_pct >= 0 ? '+' : ''}${r.strategy_return_pct.toFixed(1)}%
      </td>
      <td class="${r.benchmark_return_pct >= 0 ? 'text-slate-300' : 'text-rose-400'} tabular-nums">
        ${r.benchmark_return_pct >= 0 ? '+' : ''}${r.benchmark_return_pct.toFixed(1)}%
      </td>
      <td class="text-slate-200 tabular-nums">${r.sharpe.toFixed(2)}</td>
      <td class="text-rose-400 tabular-nums">${r.max_drawdown.toFixed(1)}%</td>
    </tr>
  `).join("");
}

function renderBacktestEquityChart(curve) {
  const ctx = document.getElementById("backtestEquityChart").getContext("2d");
  if (AppState.charts.btEquity) {
    AppState.charts.btEquity.destroy();
  }

  const step = Math.max(1, Math.floor(curve.length / 80));
  const sampled = curve.filter((_, i) => i % step === 0 || i === curve.length - 1);

  const labels = sampled.map((p) => p.date);
  const stratData = sampled.map((p) => p.equity);
  const bmarkData = sampled.map((p) => p.benchmark_equity);

  AppState.charts.btEquity = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Strategy Equity",
          data: stratData,
          borderColor: "#00D09C",
          backgroundColor: "rgba(0, 208, 156, 0.08)",
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: "NIFTY 50 Benchmark",
          data: bmarkData,
          borderColor: "#64748b",
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 9 }, maxTicksLimit: 6 } },
        y: { grid: { color: "rgba(255,255,255,0.03)" }, ticks: { color: "#64748b", font: { size: 9 } } },
      },
    },
  });
}

function renderBacktestDrawdownChart(curve) {
  const ctx = document.getElementById("backtestDrawdownChart").getContext("2d");
  if (AppState.charts.btDrawdown) {
    AppState.charts.btDrawdown.destroy();
  }

  const step = Math.max(1, Math.floor(curve.length / 80));
  const sampled = curve.filter((_, i) => i % step === 0 || i === curve.length - 1);

  const labels = sampled.map((p) => p.date);
  const ddData = sampled.map((p) => p.drawdown_pct);

  AppState.charts.btDrawdown = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Drawdown (%)",
          data: ddData,
          borderColor: "#EB5B3C",
          backgroundColor: "rgba(235, 91, 60, 0.15)",
          fill: true,
          borderWidth: 1.5,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 9 }, maxTicksLimit: 6 } },
        y: { grid: { color: "rgba(255,255,255,0.03)" }, ticks: { color: "#64748b", font: { size: 9 } } },
      },
    },
  });
}

// ===================================================================
// TAB 3: GROW (AI PORTFOLIO BASKET WIZARD & TRUST CARD)
// ===================================================================

function updateCapitalDisplay(val) {
  AppState.capital = parseFloat(val);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(AppState.capital);
  document.getElementById("capitalDisplay").innerText = formatted;
}

function selectHorizon(h) {
  triggerHaptic(8);
  AppState.horizon = h;
  document.querySelectorAll("#tab-grow .chip-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-horizon") === h);
  });
}

function selectRiskPersona(p) {
  triggerHaptic(8);
  AppState.riskPersona = p;
  document.querySelectorAll(".segment-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-persona") === p);
  });
}

async function generateBasket() {
  triggerHaptic(15);
  const loading = document.getElementById("basketLoading");
  const card = document.getElementById("basketCard");
  const btn = document.getElementById("generateBasketBtn");

  try {
    loading.classList.remove("hidden");
    card.classList.add("hidden");
    btn.disabled = true;

    const response = await fetch("/api/grow/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capital: AppState.capital,
        horizon: AppState.horizon,
        risk_persona: AppState.riskPersona,
      }),
    });

    if (!response.ok) throw new Error("Failed to generate AI basket");
    const data = await response.json();
    AppState.currentBasket = data;

    renderBasketDetails(data);
    loading.classList.add("hidden");
    card.classList.remove("hidden");
  } catch (err) {
    console.error("Error generating basket:", err);
    loading.classList.add("hidden");
  } finally {
    btn.disabled = false;
    if (window.lucide) lucide.createIcons();
  }
}

function renderBasketDetails(data) {
  document.getElementById("basketRegimeContext").innerText = 
    `Optimized for ${data.active_regime} • ${data.risk_persona} Persona`;

  // Update Discrete Allocation & Cash Buffer Pill
  const investedEl = document.getElementById("basketEquitiesSpent");
  const cashBufferEl = document.getElementById("basketCashBuffer");
  if (investedEl && cashBufferEl) {
    const totalInv = data.total_invested || (data.capital - (data.unallocated_cash || 0));
    const cashBuf = data.unallocated_cash || 0;
    const bufPct = data.cash_buffer_pct || (data.capital > 0 ? (cashBuf / data.capital) * 100 : 0);
    investedEl.innerText = `₹${totalInv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    cashBufferEl.innerText = `₹${cashBuf.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${bufPct.toFixed(1)}%)`;
  }

  // Render Donut Chart
  renderAllocationDonut(data.allocations);

  // Render Allocation Pills List
  const listEl = document.getElementById("basketStockList");
  listEl.innerHTML = data.allocations.map((item) => {
    const shares = item.shares || item.shares_approx || 0;
    const allocatedAmt = item.allocated_amount || (shares * item.current_price) || item.target_amount;
    return `
    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-750 text-xs">
      <div>
        <span class="font-bold text-white">${item.symbol}</span>
        <span class="text-[10px] text-slate-400 block">${item.name} (${(item.weight * 100).toFixed(1)}%)</span>
      </div>
      <div class="text-right">
        <div class="font-semibold text-emerald-400 tabular-nums">₹${allocatedAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div class="text-[10px] text-slate-400 tabular-nums">${shares} shares @ ₹${item.current_price.toFixed(1)}</div>
      </div>
    </div>
    `;
  }).join("");

  // Render 3-Tier Rupee Projections
  const proj = data.growth_projections;
  const rupeeContainer = document.getElementById("rupeeTierContainer");
  rupeeContainer.innerHTML = `
    <div class="tier-scenario-card tier-optimistic">
      <div>
        <div class="text-[10px] font-bold text-emerald-400 uppercase">Optimistic Scenario (Q90)</div>
        <div class="text-xs text-slate-300">Bullish macro tailwinds & sector momentum</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-bold text-white tabular-nums">₹${proj.optimistic.projected_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div class="text-[10px] font-semibold text-emerald-400 tabular-nums">+${proj.optimistic.return_pct.toFixed(1)}%</div>
      </div>
    </div>
    <div class="tier-scenario-card tier-base">
      <div>
        <div class="text-[10px] font-bold text-blue-400 uppercase">Base Case Scenario (Q50)</div>
        <div class="text-xs text-slate-300">Median quantile market expectations</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-bold text-white tabular-nums">₹${proj.base.projected_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div class="text-[10px] font-semibold text-blue-400 tabular-nums">+${proj.base.return_pct.toFixed(1)}%</div>
      </div>
    </div>
    <div class="tier-scenario-card tier-pessimistic">
      <div>
        <div class="text-[10px] font-bold text-rose-400 uppercase">Pessimistic Scenario (Q10)</div>
        <div class="text-xs text-slate-300">High volatility or market consolidation stress</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-bold text-white tabular-nums">₹${proj.pessimistic.projected_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div class="text-[10px] font-semibold text-rose-400 tabular-nums">${proj.pessimistic.return_pct.toFixed(1)}%</div>
      </div>
    </div>
  `;

  // Render 4-Pillar Trust Card
  const trust = data.trust_card;
  const trustContainer = document.getElementById("trustPillarsContainer");
  trustContainer.innerHTML = `
    <div class="trust-pillar-card">
      <div class="trust-pillar-title">Regime Suitability</div>
      <div class="trust-pillar-val text-emerald-400 tabular-nums">${trust.regime_context.regime_suitability_score.toFixed(0)}/100</div>
      <div class="trust-pillar-desc">${trust.regime_context.active_regime} tailored</div>
    </div>
    <div class="trust-pillar-card">
      <div class="trust-pillar-title">Directional Hit Rate</div>
      <div class="trust-pillar-val text-white tabular-nums">${trust.model_reliability.backtested_hit_rate_pct.toFixed(1)}%</div>
      <div class="trust-pillar-desc">5-Yr backtested validation</div>
    </div>
    <div class="trust-pillar-card">
      <div class="trust-pillar-title">Drawdown Guardrail</div>
      <div class="trust-pillar-val text-rose-400 tabular-nums">${trust.drawdown_guardrail.historical_stress_drawdown_pct.toFixed(1)}%</div>
      <div class="trust-pillar-desc">${trust.drawdown_guardrail.stress_scenario_name}</div>
    </div>
    <div class="trust-pillar-card">
      <div class="trust-pillar-title">Disintermediation</div>
      <div class="trust-pillar-val text-emerald-400 tabular-nums">₹${trust.disintermediation_savings.annual_savings_vs_mutual_funds.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
      <div class="trust-pillar-desc">Saved/yr vs 1.5% regular MF fees</div>
    </div>
  `;

  // Render Benchmark Alternatives
  const altContainer = document.getElementById("benchmarkComparisonList");
  altContainer.innerHTML = `
    <div class="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
      <span class="text-slate-300">NIFTY 50 Historical Return</span>
      <span class="font-bold text-white tabular-nums">~12.4% p.a.</span>
    </div>
    <div class="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
      <span class="text-slate-300">Bank Fixed Deposit (FD)</span>
      <span class="font-bold text-slate-400 tabular-nums">~6.8% p.a.</span>
    </div>
  `;
}

function renderAllocationDonut(allocations) {
  const ctx = document.getElementById("basketAllocationChart").getContext("2d");
  if (AppState.charts.allocationDonut) {
    AppState.charts.allocationDonut.destroy();
  }

  const labels = allocations.map((a) => a.symbol);
  const data = allocations.map((a) => Math.round(a.weight * 100));
  const colors = ["#00D09C", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#06b6d4"];

  AppState.charts.allocationDonut = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: "#18181F",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
      cutout: "68%",
    },
  });
}

// ===================================================================
// TAB 4: PORTFOLIO TAB & MULTI-PORTFOLIO MANAGEMENT
// ===================================================================

async function activateBasketToPortfolio() {
  triggerHaptic(20);
  if (!AppState.currentBasket) return;
  const btn = document.getElementById("activatePortfolioBtn");
  btn.disabled = true;

  try {
    const payload = {
      name: `AI ${AppState.riskPersona} Portfolio`,
      capital: AppState.capital,
      basket_id: AppState.currentBasket.basket_id,
      horizon: AppState.horizon,
      risk_persona: AppState.riskPersona,
    };

    const resp = await fetch("/api/portfolio/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) throw new Error("Failed to activate portfolio");
    const portData = await resp.json();
    
    // Store in multi-portfolio list
    AppState.activePortfolioId = portData.portfolio_id;
    AppState.activePortfolio = portData;
    if (!AppState.portfolios.some((p) => p.portfolio_id === portData.portfolio_id)) {
      AppState.portfolios.push(portData);
    }
    updatePortfolioSelector();

    // Switch to Portfolio Tab
    switchTab("portfolio");
    renderPortfolioState(portData);
    renderHomeTab(); // Update adaptive Home tab snapshot
  } catch (err) {
    console.error("Error activating portfolio:", err);
  } finally {
    btn.disabled = false;
  }
}

function updatePortfolioSelector() {
  const sel = document.getElementById("portfolioSelector");
  if (!sel) return;
  sel.innerHTML = AppState.portfolios.map((p) => 
    `<option value="${p.portfolio_id}" ${p.portfolio_id === AppState.activePortfolioId ? 'selected' : ''}>${p.name}</option>`
  ).join("");
}

function handlePortfolioSwitch(portId) {
  triggerHaptic(10);
  if (!portId) return;
  AppState.activePortfolioId = portId;
  const found = AppState.portfolios.find((p) => p.portfolio_id === portId);
  if (found) {
    AppState.activePortfolio = found;
    renderPortfolioState(found);
    renderHomeTab();
  }
  refreshPortfolioView();
}

async function refreshPortfolioView() {
  if (!AppState.activePortfolioId) return;
  try {
    const resp = await fetch(`/api/portfolio/${AppState.activePortfolioId}`);
    if (!resp.ok) return;
    const data = await resp.json();
    AppState.activePortfolio = data;
    renderPortfolioState(data);
    renderHomeTab();

    // Check Rebalance Diff
    await checkRebalanceDiff();
  } catch (err) {
    console.error("Error refreshing portfolio:", err);
  }
}

function renderPortfolioState(port) {
  document.getElementById("portfolioNameSubtitle").innerText = `${port.name} • ${port.risk_persona}`;
  document.getElementById("portValuationTotal").innerText = `₹${port.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  document.getElementById("portValuationInvested").innerText = `₹${port.invested_capital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const pnlEl = document.getElementById("portValuationPnl");
  pnlEl.innerText = `${port.total_pnl >= 0 ? '+' : ''}₹${port.total_pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${port.total_pnl_pct.toFixed(1)}%)`;
  pnlEl.className = `text-base font-bold ${port.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-0.5 tabular-nums`;

  if (port.benchmark_comparison) {
    const alpha = port.benchmark_comparison.alpha_vs_nifty;
    const alphaEl = document.getElementById("portValuationAlpha");
    alphaEl.innerText = `${alpha >= 0 ? '+' : ''}${alpha.toFixed(1)}%`;
    alphaEl.className = `text-base font-bold ${alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-0.5 tabular-nums`;
  }

  // Holdings Table
  const tbody = document.getElementById("portHoldingsBody");
  tbody.innerHTML = port.holdings.map((h) => `
    <tr>
      <td>
        <span class="font-bold text-white">${h.symbol}</span>
        <span class="text-[10px] text-slate-400 block">${h.sector}</span>
      </td>
      <td class="text-slate-300 font-medium tabular-nums">${h.shares}</td>
      <td class="text-slate-300 tabular-nums">₹${h.current_price.toFixed(1)}</td>
      <td class="font-semibold text-white tabular-nums">₹${h.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
      <td class="text-emerald-400 tabular-nums">${(h.weight * 100).toFixed(1)}%</td>
      <td class="${h.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold tabular-nums">
        ${h.unrealized_pnl >= 0 ? '+' : ''}${h.unrealized_pnl_pct.toFixed(1)}%
      </td>
    </tr>
  `).join("");
}

async function checkRebalanceDiff() {
  if (!AppState.activePortfolioId) return;
  try {
    const resp = await fetch(`/api/portfolio/${AppState.activePortfolioId}/rebalance`);
    if (!resp.ok) return;
    const alert = await resp.json();

    const badge = document.getElementById("rebalanceBadge");
    const reason = document.getElementById("rebalanceReason");
    const actions = document.getElementById("rebalanceActions");

    if (alert.is_rebalance_recommended) {
      badge.innerText = "Rebalance Suggested";
      badge.className = "text-[10px] font-semibold bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30";
      reason.innerText = alert.summary;
      actions.classList.remove("hidden");
    } else {
      badge.innerText = "In Sync";
      badge.className = "text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30";
      reason.innerText = alert.summary;
      actions.classList.add("hidden");
    }
  } catch (err) {
    console.error("Error checking rebalance:", err);
  }
}

async function applyRebalance() {
  triggerHaptic(15);
  if (!AppState.activePortfolioId) return;
  try {
    const resp = await fetch(`/api/portfolio/${AppState.activePortfolioId}/rebalance/apply`, {
      method: "POST",
    });
    if (!resp.ok) return;
    const updated = await resp.json();
    AppState.activePortfolio = updated;
    renderPortfolioState(updated);
    renderHomeTab();
    await checkRebalanceDiff();
  } catch (err) {
    console.error("Error applying rebalance:", err);
  }
}

// ===================================================================
// BROKER ORDER SHEET EXPORT & MODAL
// ===================================================================

async function openOrderSheetModal() {
  openModalSheet("orderSheetModal");

  if (!AppState.activePortfolioId) {
    if (AppState.currentBasket) {
      const validAlloc = AppState.currentBasket.allocations.filter(a => (a.shares || a.shares_approx || 0) > 0);
      const orders = validAlloc.map(a => 
        `${a.symbol},NSE,BUY,MARKET,${a.shares || a.shares_approx},${a.current_price.toFixed(2)},CNC`
      );
      const csv = "Tradingsymbol,Exchange,Action,Order_type,Quantity,Price,Product\n" + orders.join("\n");
      document.getElementById("zerodhaCsvText").value = csv;

      const growwOrders = validAlloc.map(a => 
        `• BUY ${a.shares || a.shares_approx} shares of ${a.symbol} at approx ₹${a.current_price.toFixed(2)} (Target: ₹${(a.allocated_amount || a.target_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })})`
      ).join("\n");
      document.getElementById("growwSummaryText").value = 
        `QuantNiti AI Basket Orders:\n${growwOrders}\n\nCash Buffer: ₹${(AppState.currentBasket.unallocated_cash || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    return;
  }

  try {
    const resp = await fetch(`/api/portfolio/${AppState.activePortfolioId}/order-sheet`);
    if (!resp.ok) return;
    const sheet = await resp.json();
    document.getElementById("zerodhaCsvText").value = sheet.zerodha_csv_text;
    document.getElementById("growwSummaryText").value = sheet.groww_clipboard_text;
  } catch (err) {
    console.error("Error generating order sheet:", err);
  }
}

function closeOrderSheetModal(event) {
  if (event) event.stopPropagation();
  closeModalSheet("orderSheetModal");
}

function copyZerodhaFormat() {
  triggerHaptic(10);
  const text = document.getElementById("zerodhaCsvText").value;
  navigator.clipboard.writeText(text);
  alert("Zerodha Basket CSV copied to clipboard!");
}

function copyGrowwFormat() {
  triggerHaptic(10);
  const text = document.getElementById("growwSummaryText").value;
  navigator.clipboard.writeText(text);
  alert("Groww order summary copied to clipboard!");
}

// ===================================================================
// IN-APP COMPETITOR BENCHMARK DRAWER MODAL
// ===================================================================

function openCompetitorBenchmarkModal() {
  openModalSheet("competitorBenchmarkModal");
}

function closeCompetitorBenchmarkModal(event) {
  if (event) event.stopPropagation();
  closeModalSheet("competitorBenchmarkModal");
}

// ===================================================================
// NITIBOT RAG CONVERSATIONAL ASSISTANT
// ===================================================================

async function checkNitiBotStatus() {
  try {
    const resp = await fetch("/api/v1/chat/health");
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.status === "healthy") {
      const bubble = document.getElementById("nitibotTriggerContainer");
      if (bubble) bubble.classList.remove("hidden");
    }
  } catch (err) {
    // Graceful offline
  }
}

function toggleNitiBotChat() {
  const modal = document.getElementById("nitibotModal");
  if (modal.classList.contains("hidden")) {
    openModalSheet("nitibotModal");
    setTimeout(() => {
      const input = document.getElementById("nitibotInputField");
      if (input) input.focus();
    }, 200);
  } else {
    closeModalSheet("nitibotModal");
  }
}

function closeNitiBotModal(event) {
  if (event) event.stopPropagation();
  closeModalSheet("nitibotModal");
}

function closeNitiBotChat() {
  closeModalSheet("nitibotModal");
}

function clearNitiBotChat() {
  triggerHaptic(10);
  AppState.nitibotSessionId = "session_" + Math.random().toString(36).substring(2, 10);
  const messagesContainer = document.getElementById("nitibotMessagesContainer");
  messagesContainer.innerHTML = `
    <div class="chat-msg chat-msg-bot">
      <div class="chat-msg-avatar">
        <i data-lucide="bot" class="w-4 h-4 text-emerald-400"></i>
      </div>
      <div class="chat-msg-bubble">
        <p class="text-xs text-slate-200 leading-relaxed">
          Namaste! I'm <strong>NitiBot</strong>, your QuantNiti quantitative intelligence assistant. Conversation cleared. How may I assist your portfolio today?
        </p>
        <div class="chat-source-tag mt-2">
          <i data-lucide="shield-check" class="w-3 h-3 text-emerald-400 inline mr-1"></i>
          <span>SEBI-Compliant Educational Intelligence</span>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function sendNitiBotQuickPrompt(promptText) {
  triggerHaptic(8);
  const input = document.getElementById("nitibotInputField");
  if (input) {
    input.value = promptText;
    sendNitiBotMessage(promptText);
  }
}

function handleNitiBotSubmit(event) {
  event.preventDefault();
  triggerHaptic(10);
  const input = document.getElementById("nitibotInputField");
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;
  sendNitiBotMessage(message);
}

function scrollToLatestNitiBotMessage() {
  const container = document.getElementById("nitibotMessagesContainer");
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function formatMarkdownResponse(text) {
  if (!text) return "";
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono text-[11px]">$1</code>')
    .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-3 list-disc">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  return formatted;
}

async function sendNitiBotMessage(messageText) {
  const input = document.getElementById("nitibotInputField");
  const sendBtn = document.getElementById("nitibotSendBtn");
  const messagesContainer = document.getElementById("nitibotMessagesContainer");
  const typingIndicator = document.getElementById("nitibotTypingIndicator");

  if (!messageText) return;

  if (input) input.value = "";
  if (sendBtn) sendBtn.disabled = true;

  const userMsgDiv = document.createElement("div");
  userMsgDiv.className = "chat-msg chat-msg-user";
  userMsgDiv.innerHTML = `
    <div class="chat-msg-avatar">
      <i data-lucide="user" class="w-4 h-4 text-emerald-400"></i>
    </div>
    <div class="chat-msg-bubble">
      <p class="text-xs text-slate-900 leading-relaxed">${escapeHtml(messageText)}</p>
    </div>
  `;
  messagesContainer.appendChild(userMsgDiv);
  if (window.lucide) lucide.createIcons();

  if (typingIndicator) typingIndicator.classList.remove("hidden");
  scrollToLatestNitiBotMessage();

  const activeContext = {
    regime: AppState.activeRegime,
    basket: AppState.currentBasket,
    backtest: AppState.activeBacktest,
  };

  try {
    const response = await fetch("/api/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageText,
        context: activeContext,
        session_id: AppState.nitibotSessionId,
      }),
    });

    if (typingIndicator) typingIndicator.classList.add("hidden");

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const botMsgDiv = document.createElement("div");
      botMsgDiv.className = "chat-msg chat-msg-bot";
      botMsgDiv.innerHTML = `
        <div class="chat-msg-avatar">
          <i data-lucide="alert-circle" class="w-4 h-4 text-rose-400"></i>
        </div>
        <div class="chat-msg-bubble border-rose-900/50 bg-rose-950/30 text-rose-200">
          <p class="text-xs">${errData.detail || "Unable to reach NitiBot at the moment. Please ensure GEMINI_API_KEY is configured."}</p>
        </div>
      `;
      messagesContainer.appendChild(botMsgDiv);
    } else {
      const data = await response.json();
      if (data.session_id) {
        AppState.nitibotSessionId = data.session_id;
      }

      const botMsgDiv = document.createElement("div");
      botMsgDiv.className = "chat-msg chat-msg-bot";

      let sourcesHtml = "";
      if (data.sources && data.sources.length > 0) {
        const sourceTags = data.sources
          .map((src) => `<span class="chat-source-tag"><i data-lucide="layers" class="w-3 h-3 text-emerald-400 inline mr-0.5"></i>${src}</span>`)
          .join(" ");
        sourcesHtml = `<div class="mt-2.5 flex flex-wrap gap-1">${sourceTags}</div>`;
      }

      botMsgDiv.innerHTML = `
        <div class="chat-msg-avatar">
          <i data-lucide="bot" class="w-4 h-4 text-emerald-400"></i>
        </div>
        <div class="chat-msg-bubble">
          <div class="text-xs text-slate-200 leading-relaxed">${formatMarkdownResponse(data.reply)}</div>
          ${sourcesHtml}
        </div>
      `;
      messagesContainer.appendChild(botMsgDiv);
    }
  } catch (err) {
    if (typingIndicator) typingIndicator.classList.add("hidden");
    const botMsgDiv = document.createElement("div");
    botMsgDiv.className = "chat-msg chat-msg-bot";
    botMsgDiv.innerHTML = `
      <div class="chat-msg-avatar">
        <i data-lucide="wifi-off" class="w-4 h-4 text-rose-400"></i>
      </div>
      <div class="chat-msg-bubble border-rose-900/50 bg-rose-950/30 text-rose-200">
        <p class="text-xs">Network error connecting to NitiBot intelligence service.</p>
      </div>
    `;
    messagesContainer.appendChild(botMsgDiv);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (window.lucide) lucide.createIcons();
    scrollToLatestNitiBotMessage();
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
