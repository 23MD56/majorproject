/**
 * QuantNiti - Modern Financial Mobile-First Single-Page Client Application
 */

// Application State Store
const AppState = {
  activeTab: "grow",
  capital: 50000,
  horizon: "6M",
  riskPersona: "Balanced",
  activeRegime: null,
  currentBasket: null,
  activePortfolioId: null,
  activePortfolio: null,
  allExploreStocks: [],
  selectedStockSymbol: null,
  activeBacktest: null,
  nitibotSessionId: "session_" + Math.random().toString(36).substring(2, 10),
  charts: {},
};

// Deferred PWA install prompt holder
let deferredPWAInstallPrompt = null;

// Initialize App on DOM Loaded
document.addEventListener("DOMContentLoaded", async () => {
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
});

// ===================================================================
// PWA & SERVICE WORKER LIFECYCLE CONTROLLER
// ===================================================================

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
  const banner = document.getElementById("iosInstallBanner");
  if (banner) {
    banner.classList.add("hidden");
  }
  localStorage.setItem("quantniti_ios_pwa_dismissed", "true");
}


// Tab Switching Controller
function switchTab(tabId) {
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
  if (tabId === "portfolio" && AppState.activePortfolioId) {
    refreshPortfolioView();
  }
}

// Toggle Responsive Layout Mode (Mobile Frame vs Expanded Desktop)
function toggleViewportMode() {
  const container = document.getElementById("appContainer");
  const isExpanded = container.classList.toggle("expanded-mode");
  const btn = document.getElementById("viewToggleBtn");
  btn.innerHTML = isExpanded 
    ? '<i data-lucide="minimize-2" class="w-4 h-4"></i>'
    : '<i data-lucide="maximize-2" class="w-4 h-4"></i>';
  if (window.lucide) lucide.createIcons();
}

// ===================================================================
// GROW TAB: WIZARD, BASKET & TRUST CARD LOGIC
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
  AppState.horizon = h;
  document.querySelectorAll("#tab-grow .chip-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-horizon") === h);
  });
}

function selectRiskPersona(p) {
  AppState.riskPersona = p;
  document.querySelectorAll(".segment-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-persona") === p);
  });
}

async function generateBasket() {
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
    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
      <div>
        <span class="font-bold text-white">${item.symbol}</span>
        <span class="text-[10px] text-slate-400 block">${item.name} (${(item.weight * 100).toFixed(1)}%)</span>
      </div>
      <div class="text-right">
        <div class="font-semibold text-indigo-300">₹${allocatedAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div class="text-[10px] text-slate-400">${shares} shares @ ₹${item.current_price.toFixed(1)}</div>
      </div>
    </div>
  `;
  }).join("");

  // Render 3-Tier Rupee Projections
  const tierContainer = document.getElementById("rupeeTierContainer");
  const proj = data.growth_projections;
  tierContainer.innerHTML = `
    <div class="tier-scenario-card tier-optimistic">
      <div>
        <div class="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          Optimistic (90th percentile)
        </div>
        <div class="text-xs text-slate-400 mt-0.5">+${proj.optimistic.expected_return_pct.toFixed(1)}% expected return</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-bold text-emerald-400">₹${proj.optimistic.projected_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div class="text-[10px] text-emerald-400/80">+₹${proj.optimistic.projected_gain_rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })} gain</div>
      </div>
    </div>
    <div class="tier-scenario-card tier-base">
      <div>
        <div class="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
          Base Case (50th percentile)
        </div>
        <div class="text-xs text-slate-400 mt-0.5">+${proj.base.expected_return_pct.toFixed(1)}% expected return</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-bold text-cyan-400">₹${proj.base.projected_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div class="text-[10px] text-cyan-400/80">+₹${proj.base.projected_gain_rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })} gain</div>
      </div>
    </div>
    <div class="tier-scenario-card tier-pessimistic">
      <div>
        <div class="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-rose-400"></span>
          Pessimistic (10th percentile)
        </div>
        <div class="text-xs text-slate-400 mt-0.5">${proj.pessimistic.expected_return_pct >= 0 ? '+' : ''}${proj.pessimistic.expected_return_pct.toFixed(1)}% return</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-bold text-rose-400">₹${proj.pessimistic.projected_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div class="text-[10px] text-rose-400/80">${proj.pessimistic.projected_gain_rupees >= 0 ? '+₹' : '-₹'}${Math.abs(proj.pessimistic.projected_gain_rupees).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
      </div>
    </div>
  `;

  // Render 4-Pillar Trust Card
  const pillars = data.trust_card;
  const pillarsEl = document.getElementById("trustPillarsContainer");
  pillarsEl.innerHTML = `
    <div class="trust-pillar-card">
      <span class="trust-pillar-title">1. Regime Context</span>
      <span class="trust-pillar-val text-emerald-400">${pillars.regime_context.regime.split(" ")[0]}</span>
      <span class="trust-pillar-desc">${(pillars.regime_context.confidence * 100).toFixed(0)}% confidence</span>
    </div>
    <div class="trust-pillar-card">
      <span class="trust-pillar-title">2. Historical Hit Rate</span>
      <span class="trust-pillar-val text-indigo-300">${pillars.model_reliability.backtested_hit_rate_pct.toFixed(1)}%</span>
      <span class="trust-pillar-desc">5-Yr backtested</span>
    </div>
    <div class="trust-pillar-card">
      <span class="trust-pillar-title">3. Stress Drawdown</span>
      <span class="trust-pillar-val text-rose-400">-${pillars.drawdown_guardrail.max_drawdown_limit_pct.toFixed(1)}%</span>
      <span class="trust-pillar-desc">Max guardrail</span>
    </div>
    <div class="trust-pillar-card">
      <span class="trust-pillar-title">4. Fee Savings</span>
      <span class="trust-pillar-val text-amber-300">₹${pillars.disintermediation_savings.estimated_annual_savings_rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/yr</span>
      <span class="trust-pillar-desc">0% commission</span>
    </div>
  `;

  // Render Benchmark Alternatives
  const benchEl = document.getElementById("benchmarkComparisonList");
  benchEl.innerHTML = data.benchmark_comparisons.map((b) => `
    <div class="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40">
      <div>
        <span class="font-medium text-slate-200">${b.name}</span>
        <span class="text-[10px] text-slate-500 block">${b.summary}</span>
      </div>
      <div class="text-right">
        <span class="font-bold ${b.projected_return_pct > 10 ? 'text-emerald-400' : 'text-slate-300'}">
          +${b.projected_return_pct.toFixed(1)}%
        </span>
        <span class="text-[10px] text-slate-400 block">₹${b.projected_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
      </div>
    </div>
  `).join("");
}

function renderAllocationDonut(allocations) {
  const ctx = document.getElementById("basketAllocationChart").getContext("2d");
  if (AppState.charts.basketDonut) {
    AppState.charts.basketDonut.destroy();
  }

  const labels = allocations.map((a) => a.symbol);
  const data = allocations.map((a) => (a.weight * 100).toFixed(1));
  const colors = [
    "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", 
    "#8b5cf6", "#14b8a6", "#f97316", "#3b82f6", "#84cc16"
  ];

  AppState.charts.basketDonut = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: "#0f172a",
        borderWidth: 2,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`,
          },
        },
      },
      cutout: "70%",
    },
  });
}

// ===================================================================
// WORKFLOW: ACTIVATE BASKET INTO VIRTUAL PAPER PORTFOLIO
// ===================================================================

async function activateBasketToPortfolio() {
  if (!AppState.currentBasket) return;
  const btn = document.getElementById("activatePortfolioBtn");
  btn.disabled = true;

  try {
    const payload = {
      name: `AI ${AppState.riskPersona} Basket Portfolio`,
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
    AppState.activePortfolioId = portData.portfolio_id;
    AppState.activePortfolio = portData;

    // Switch to Portfolio Tab
    switchTab("portfolio");
    renderPortfolioState(portData);
  } catch (err) {
    console.error("Error activating portfolio:", err);
  } finally {
    btn.disabled = false;
  }
}

// ===================================================================
// EXPLORE TAB: STOCK LIST, SEARCH & 360° PROFILE MODAL
// ===================================================================

async function loadExploreStocks() {
  try {
    const resp = await fetch("/api/explore/stocks");
    if (!resp.ok) return;
    const stocks = await resp.json();
    AppState.allExploreStocks = stocks;
    renderExploreStockGrid(stocks);
  } catch (err) {
    console.error("Error loading explore stocks:", err);
  }
}

function filterBySector(sector) {
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
  if (!stocks.length) {
    grid.innerHTML = `<div class="col-span-2 text-center py-8 text-xs text-slate-500">No stocks matching your criteria</div>`;
    return;
  }

  grid.innerHTML = stocks.map((stock) => `
    <div class="glass-card-sm cursor-pointer hover:border-slate-600 transition-all" onclick="openStockProfileModal('${stock.symbol}')">
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
          <span class="text-xs font-semibold text-white">₹${stock.current_price.toFixed(1)}</span>
          <span class="text-[10px] ${stock.day_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'} block">
            ${stock.day_change_pct >= 0 ? '+' : ''}${stock.day_change_pct.toFixed(2)}%
          </span>
        </div>
        <div class="text-right">
          <span class="text-[10px] text-slate-500 block">6M Expected Growth</span>
          <span class="text-xs font-bold text-emerald-400">+${stock.growth_6m_base_pct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  `).join("");
}

async function openStockProfileModal(symbol) {
  AppState.selectedStockSymbol = symbol;
  const modal = document.getElementById("stockProfileModal");
  modal.classList.add("active");

  try {
    const resp = await fetch(`/api/explore/profile/${symbol}`);
    if (!resp.ok) return;
    const profile = await resp.json();

    document.getElementById("modalStockSymbol").innerText = profile.symbol;
    document.getElementById("modalStockName").innerText = `${profile.name} • ${profile.sector}`;
    document.getElementById("modalStockPrice").innerText = `₹${profile.current_price.toFixed(2)}`;
    
    const changeEl = document.getElementById("modalStockChange");
    changeEl.innerText = `${profile.day_change_pct >= 0 ? '+' : ''}${profile.day_change_pct.toFixed(2)}%`;
    changeEl.className = `text-xs font-semibold ${profile.day_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;

    renderForecastConesChart(profile.forecast);

    // Factors Grid
    const f = profile.factors;
    document.getElementById("stockFactorsGrid").innerHTML = `
      <div class="glass-card-sm">
        <div class="text-[10px] text-slate-400 uppercase font-medium">RSI (14)</div>
        <div class="text-xs font-bold text-white">${f.rsi_14.toFixed(1)}</div>
      </div>
      <div class="glass-card-sm">
        <div class="text-[10px] text-slate-400 uppercase font-medium">Annualized Alpha</div>
        <div class="text-xs font-bold text-emerald-400">+${(f.alpha_annualized * 100).toFixed(1)}%</div>
      </div>
      <div class="glass-card-sm">
        <div class="text-[10px] text-slate-400 uppercase font-medium">Market Beta</div>
        <div class="text-xs font-bold text-white">${f.beta.toFixed(2)}</div>
      </div>
      <div class="glass-card-sm">
        <div class="text-[10px] text-slate-400 uppercase font-medium">Regime Score</div>
        <div class="text-xs font-bold text-indigo-300">${profile.suitability.score.toFixed(0)}/100</div>
      </div>
    `;
  } catch (err) {
    console.error("Error opening profile:", err);
  }
}

function closeStockProfileModal(event) {
  if (event) event.stopPropagation();
  document.getElementById("stockProfileModal").classList.remove("active");
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
          label: "Optimistic (90th)",
          data: opt,
          borderColor: "#10b981",
          borderDash: [5, 5],
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: "+1",
          tension: 0.3,
        },
        {
          label: "Base Case (50th)",
          data: base,
          borderColor: "#6366f1",
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: "Pessimistic (10th)",
          data: pess,
          borderColor: "#f43f5e",
          borderDash: [5, 5],
          backgroundColor: "rgba(244, 63, 94, 0.08)",
          fill: "-1",
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } },
        y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } },
      },
    },
  });
}

function backtestCurrentStock() {
  if (!AppState.selectedStockSymbol) return;
  closeStockProfileModal();
  
  // Set backtest symbol and switch to Quant Lab tab
  const select = document.getElementById("backtestSymbolSelect");
  if (select) {
    select.value = AppState.selectedStockSymbol;
  }
  switchTab("quantlab");
  runBacktest();
}

// ===================================================================
// QUANT LAB TAB: REGIME RADAR & BACKTEST STUDIO
// ===================================================================

async function fetchCurrentRegime() {
  try {
    const resp = await fetch("/api/regime/current");
    if (!resp.ok) return;
    const data = await resp.json();
    AppState.activeRegime = data;

    // Update Header Pill
    const headerPill = document.getElementById("headerRegimeBadge");
    const headerText = document.getElementById("headerRegimeText");
    if (headerPill && headerText) {
      headerText.innerText = data.regime;
      headerPill.className = `regime-pill-badge ${data.regime.includes("Bull") ? 'regime-bull' : data.regime.includes("Bear") ? 'regime-bear' : 'regime-sideways'} cursor-pointer`;
    }

    // Update Quant Lab Radar
    const bullPct = Math.round(data.probabilities.bull * 100);
    const sidePct = Math.round(data.probabilities.sideways * 100);
    const bearPct = Math.round(data.probabilities.bear * 100);

    document.getElementById("radarBullProb").innerText = `${bullPct}%`;
    document.getElementById("radarBullBar").style.width = `${bullPct}%`;
    document.getElementById("radarSidewaysProb").innerText = `${sidePct}%`;
    document.getElementById("radarSidewaysBar").style.width = `${sidePct}%`;
    document.getElementById("radarBearProb").innerText = `${bearPct}%`;
    document.getElementById("radarBearBar").style.width = `${bearPct}%`;

    document.getElementById("radarRegimeBadge").innerText = `${data.regime} (${(data.confidence * 100).toFixed(0)}%)`;
    document.getElementById("radarDescription").innerText = data.description;
  } catch (err) {
    console.error("Error fetching regime:", err);
  }
}

async function runBacktest() {
  const symbol = document.getElementById("backtestSymbolSelect").value;
  const strategy = document.getElementById("backtestStrategySelect").value;
  const capital = parseFloat(document.getElementById("backtestCapitalInput").value) || 100000;
  const cost = parseFloat(document.getElementById("backtestCostInput").value) || 5;
  const slippage = parseFloat(document.getElementById("backtestSlippageInput").value) || 5;
  const btn = document.getElementById("runBacktestBtn");

  try {
    btn.disabled = true;
    const resp = await fetch("/api/backtest/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: symbol,
        strategy: strategy,
        initial_capital: capital,
        cost_bps: cost,
        slippage_bps: slippage,
      }),
    });

    if (!resp.ok) throw new Error("Backtest failed");
    const data = await resp.json();

    renderBacktestResults(data);
  } catch (err) {
    console.error("Error running backtest:", err);
  } finally {
    btn.disabled = false;
  }
}

function renderBacktestResults(data) {
  AppState.activeBacktest = data;
  const card = document.getElementById("backtestResultCard");
  card.classList.remove("hidden");

  document.getElementById("btResultTitle").innerText = `${data.symbol} • ${data.strategy}`;
  document.getElementById("btResultSubtitle").innerText = `${data.start_date} to ${data.end_date}`;

  const m = data.metrics;
  const metricsGrid = document.getElementById("btMetricsGrid");
  metricsGrid.innerHTML = `
    <div class="glass-card-sm text-center">
      <div class="text-[9px] text-slate-400 uppercase">CAGR</div>
      <div class="text-xs font-bold ${m.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-0.5">${(m.cagr * 100).toFixed(1)}%</div>
    </div>
    <div class="glass-card-sm text-center">
      <div class="text-[9px] text-slate-400 uppercase">Sharpe</div>
      <div class="text-xs font-bold text-white mt-0.5">${m.sharpe_ratio.toFixed(2)}</div>
    </div>
    <div class="glass-card-sm text-center">
      <div class="text-[9px] text-slate-400 uppercase">Sortino</div>
      <div class="text-xs font-bold text-white mt-0.5">${m.sortino_ratio.toFixed(2)}</div>
    </div>
    <div class="glass-card-sm text-center">
      <div class="text-[9px] text-slate-400 uppercase">Max DD</div>
      <div class="text-xs font-bold text-rose-400 mt-0.5">${m.max_drawdown_pct.toFixed(1)}%</div>
    </div>
    <div class="glass-card-sm text-center">
      <div class="text-[9px] text-slate-400 uppercase">Win Rate</div>
      <div class="text-xs font-bold text-indigo-300 mt-0.5">${m.win_rate_pct.toFixed(1)}%</div>
    </div>
    <div class="glass-card-sm text-center">
      <div class="text-[9px] text-slate-400 uppercase">Alpha</div>
      <div class="text-xs font-bold text-emerald-400 mt-0.5">+${(m.alpha * 100).toFixed(1)}%</div>
    </div>
  `;

  // Render Equity Curve Chart
  renderBacktestEquityChart(data.equity_curve);

  // Render Drawdown Chart
  renderBacktestDrawdownChart(data.equity_curve);

  // Render Regime Breakdown
  const tbody = document.querySelector("#btRegimeTable tbody");
  tbody.innerHTML = data.regime_breakdown.map((r) => `
    <tr>
      <td class="font-medium">${r.regime}</td>
      <td class="text-slate-400">${r.days_count}</td>
      <td class="${r.strategy_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold">
        ${r.strategy_return_pct >= 0 ? '+' : ''}${r.strategy_return_pct.toFixed(1)}%
      </td>
      <td class="text-slate-400">${r.benchmark_return_pct >= 0 ? '+' : ''}${r.benchmark_return_pct.toFixed(1)}%</td>
      <td class="text-white">${r.sharpe_ratio.toFixed(2)}</td>
      <td class="text-rose-400">-${Math.abs(r.max_drawdown_pct).toFixed(1)}%</td>
    </tr>
  `).join("");
}

function renderBacktestEquityChart(curve) {
  const ctx = document.getElementById("backtestEquityChart").getContext("2d");
  if (AppState.charts.btEquity) {
    AppState.charts.btEquity.destroy();
  }

  // Sample data points to avoid chart congestion
  const step = Math.max(1, Math.floor(curve.length / 80));
  const sampled = curve.filter((_, i) => i % step === 0 || i === curve.length - 1);

  const labels = sampled.map((p) => p.date);
  const stratData = sampled.map((p) => p.strategy_equity);
  const benchData = sampled.map((p) => p.benchmark_equity);

  AppState.charts.btEquity = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Strategy Equity",
          data: stratData,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.08)",
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: "Benchmark (^NSEI)",
          data: benchData,
          borderColor: "#64748b",
          borderWidth: 1.5,
          pointRadius: 0,
          borderDash: [4, 4],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { color: "#94a3b8", font: { size: 10 } } },
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.03)" }, ticks: { color: "#64748b", font: { size: 9 }, maxTicksLimit: 6 } },
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
          borderColor: "#f43f5e",
          backgroundColor: "rgba(244, 63, 94, 0.2)",
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
// PORTFOLIO TAB: VIRTUAL TRACKER, REBALANCE & BROKER ORDER SHEET
// ===================================================================

async function refreshPortfolioView() {
  if (!AppState.activePortfolioId) return;
  try {
    const resp = await fetch(`/api/portfolio/${AppState.activePortfolioId}`);
    if (!resp.ok) return;
    const data = await resp.json();
    AppState.activePortfolio = data;
    renderPortfolioState(data);

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
  pnlEl.className = `text-base font-bold ${port.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-0.5`;

  if (port.benchmark_comparison) {
    const alpha = port.benchmark_comparison.alpha_vs_nifty;
    const alphaEl = document.getElementById("portValuationAlpha");
    alphaEl.innerText = `${alpha >= 0 ? '+' : ''}${alpha.toFixed(1)}%`;
    alphaEl.className = `text-base font-bold ${alpha >= 0 ? 'text-indigo-400' : 'text-rose-400'} mt-0.5`;
  }

  // Holdings Table
  const tbody = document.getElementById("portHoldingsBody");
  tbody.innerHTML = port.holdings.map((h) => `
    <tr>
      <td>
        <span class="font-bold text-white">${h.symbol}</span>
        <span class="text-[10px] text-slate-400 block">${h.sector}</span>
      </td>
      <td class="text-slate-300 font-medium">${h.shares}</td>
      <td class="text-slate-300">₹${h.current_price.toFixed(1)}</td>
      <td class="font-semibold text-white">₹${h.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
      <td class="text-indigo-300">${(h.weight * 100).toFixed(1)}%</td>
      <td class="${h.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold">
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
  if (!AppState.activePortfolioId) return;
  try {
    const resp = await fetch(`/api/portfolio/${AppState.activePortfolioId}/rebalance/apply`, {
      method: "POST",
    });
    if (!resp.ok) return;
    const updated = await resp.json();
    AppState.activePortfolio = updated;
    renderPortfolioState(updated);
    await checkRebalanceDiff();
  } catch (err) {
    console.error("Error applying rebalance:", err);
  }
}

async function openOrderSheetModal() {
  const modal = document.getElementById("orderSheetModal");
  modal.classList.add("active");

  if (!AppState.activePortfolioId) {
    // If no portfolio yet, create a default order sheet from basket
    if (AppState.currentBasket) {
      const validAlloc = AppState.currentBasket.allocations.filter(a => (a.shares || a.shares_approx || 0) > 0);
      const orders = validAlloc.map(a => 
        `${a.symbol},NSE,BUY,MARKET,${a.shares || a.shares_approx},${a.current_price.toFixed(2)},CNC`
      ).join("\n");
      document.getElementById("zerodhaCsvText").value = `Instrument,Exchange,Action,Order Type,Quantity,Price,Product Type\n${orders}`;
      
      const totalInv = AppState.currentBasket.total_invested || AppState.currentBasket.capital;
      const cashBuf = AppState.currentBasket.unallocated_cash || 0;
      const growwLines = [
        `QuantNiti Order Sheet - AI Portfolio Basket`,
        `Total Orders: ${validAlloc.length} | Total Invested: ₹${totalInv.toLocaleString('en-IN', { maximumFractionDigits: 0 })} | Cash Buffer: ₹${cashBuf.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
        `----------------------------------------`,
        ...validAlloc.map(a => {
          const sh = a.shares || a.shares_approx || 0;
          const amt = a.allocated_amount || (sh * a.current_price);
          return `• BUY ${sh} shares of ${a.symbol} @ ₹${a.current_price.toFixed(2)} (₹${amt.toLocaleString('en-IN', { maximumFractionDigits: 0 })})`;
        }),
        `----------------------------------------`,
      ];
      document.getElementById("growwSummaryText").value = growwLines.join("\n");
    }
    return;
  }

  try {
    const resp = await fetch(`/api/portfolio/${AppState.activePortfolioId}/order-sheet`);
    if (!resp.ok) return;
    const data = await resp.json();
    document.getElementById("zerodhaCsvText").value = data.zerodha_csv_text;
    document.getElementById("growwSummaryText").value = data.groww_clipboard_text;
  } catch (err) {
    console.error("Error fetching order sheet:", err);
  }
}

function closeOrderSheetModal(event) {
  if (event) event.stopPropagation();
  document.getElementById("orderSheetModal").classList.remove("active");
}

function copyZerodhaFormat() {
  const text = document.getElementById("zerodhaCsvText").value;
  navigator.clipboard.writeText(text);
  alert("Zerodha CSV format copied to clipboard!");
}

function copyGrowwFormat() {
  const text = document.getElementById("growwSummaryText").value;
  navigator.clipboard.writeText(text);
  alert("Groww order summary copied to clipboard!");
}

// ===================================================================
// COMPETITOR BENCHMARK DRAWER LOGIC
// ===================================================================

function openCompetitorBenchmarkModal() {
  const modal = document.getElementById("competitorBenchmarkModal");
  if (modal) {
    modal.classList.add("active");
    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

function closeCompetitorBenchmarkModal(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById("competitorBenchmarkModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Global Keyboard Handler for Modal Accessibility (Escape Key)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeStockProfileModal(e);
    closeOrderSheetModal(e);
    closeCompetitorBenchmarkModal(e);
    closeNitiBotChat();
  }
});

// ===================================================================
// NITIBOT CONVERSATIONAL RAG ASSISTANT CONTROLLER (Ticket 12)
// ===================================================================

async function checkNitiBotStatus() {
  try {
    const resp = await fetch("/api/chat/status");
    if (resp.ok) {
      const data = await resp.json();
      const trigger = document.getElementById("nitibotTriggerContainer");
      if (data.available && trigger) {
        trigger.classList.remove("hidden");
      } else if (trigger) {
        trigger.classList.add("hidden");
      }
    }
  } catch (err) {
    console.warn("NitiBot service status check failed:", err);
  }
}

function toggleNitiBotChat() {
  const modal = document.getElementById("nitibotModal");
  if (!modal) return;
  if (modal.classList.contains("active")) {
    closeNitiBotChat();
  } else {
    openNitiBotChat();
  }
}

function openNitiBotChat() {
  const modal = document.getElementById("nitibotModal");
  if (modal) {
    modal.classList.remove("hidden");
    // Trigger animation next frame
    requestAnimationFrame(() => {
      modal.classList.add("active");
    });
    if (window.lucide) {
      lucide.createIcons();
    }
    const input = document.getElementById("nitibotInputField");
    if (input) {
      setTimeout(() => input.focus(), 200);
    }
    scrollToLatestNitiBotMessage();
  }
}

function closeNitiBotChat() {
  const modal = document.getElementById("nitibotModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      if (!modal.classList.contains("active")) {
        modal.classList.add("hidden");
      }
    }, 300);
  }
}

function closeNitiBotModal(event) {
  if (event) event.stopPropagation();
  closeNitiBotChat();
}

function clearNitiBotChat() {
  AppState.nitibotSessionId = "session_" + Math.random().toString(36).substring(2, 10);
  const container = document.getElementById("nitibotMessagesContainer");
  if (container) {
    container.innerHTML = `
      <div class="chat-msg chat-msg-bot">
        <div class="chat-msg-avatar">
          <i data-lucide="bot" class="w-4 h-4 text-indigo-300"></i>
        </div>
        <div class="chat-msg-bubble">
          <p class="text-xs text-slate-200 leading-relaxed">
            Conversation reset. Namaste! I'm <strong>NitiBot</strong>. How can I help explain your portfolio or quantitative metrics today?
          </p>
          <div class="chat-source-tag mt-2">
            <i data-lucide="shield-check" class="w-3 h-3 text-emerald-400 inline mr-1"></i>
            <span>SEBI-Compliant Educational Intelligence</span>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

function sendNitiBotQuickPrompt(promptText) {
  const input = document.getElementById("nitibotInputField");
  if (input) {
    input.value = promptText;
    sendNitiBotMessage(promptText);
  }
}

function handleNitiBotSubmit(event) {
  if (event) event.preventDefault();
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
    // Replace bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Replace italic *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Replace inline code `code`
    .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 font-mono text-[11px]">$1</code>')
    // Replace bullet points starting with - or *
    .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-3 list-disc">$1</li>')
    // Replace newlines with breaks if not wrapped in lists
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

  // Clear input
  if (input) input.value = "";
  if (sendBtn) sendBtn.disabled = true;

  // Append user message
  const userMsgDiv = document.createElement("div");
  userMsgDiv.className = "chat-msg chat-msg-user";
  userMsgDiv.innerHTML = `
    <div class="chat-msg-avatar">
      <i data-lucide="user" class="w-4 h-4 text-emerald-300"></i>
    </div>
    <div class="chat-msg-bubble">
      <p class="text-xs text-white leading-relaxed">${escapeHtml(messageText)}</p>
    </div>
  `;
  messagesContainer.appendChild(userMsgDiv);
  if (window.lucide) lucide.createIcons();

  // Show typing indicator & scroll
  if (typingIndicator) typingIndicator.classList.remove("hidden");
  scrollToLatestNitiBotMessage();

  // Prepare context payload from active AppState
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
          .map((src) => `<span class="chat-source-tag"><i data-lucide="layers" class="w-3 h-3 text-indigo-400 inline mr-0.5"></i>${src}</span>`)
          .join(" ");
        sourcesHtml = `<div class="mt-2.5 flex flex-wrap gap-1">${sourceTags}</div>`;
      }

      botMsgDiv.innerHTML = `
        <div class="chat-msg-avatar">
          <i data-lucide="bot" class="w-4 h-4 text-indigo-300"></i>
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


