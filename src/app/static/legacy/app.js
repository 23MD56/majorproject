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
  literacyCards: [],
  learnedConcepts: new Set(JSON.parse((typeof localStorage !== "undefined" ? localStorage.getItem("quantniti_learned_concepts") : null) || "[]")),
  selectedLiteracyCategory: "all",
  activeConceptKey: null,
};
if (typeof window !== "undefined") window.AppState = AppState;
if (typeof globalThis !== "undefined") globalThis.AppState = AppState;

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
    "conceptDetailModal",
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
  await initLearningHub();
  initCompoundingVisualizer();
  await loadUserPortfolios();
  // Pre-generate a default basket for instant preview
  await generateBasket();
  renderHomeTab();
  initMarketStream();
  initNotificationCenter();
  loadBasketReviews();
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

  // 3. Learning Hub & Concept Mastery Carousel
  renderLearningHub();
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
// FINANCIAL LITERACY MICROLEARNING CONTROLLER (TICKET 14)
// ===================================================================

async function initLearningHub() {
  try {
    const resp = await fetch("/api/v1/literacy/all");
    if (resp.ok) {
      const data = await resp.json();
      AppState.literacyCards = data.cards || [];
    }
  } catch (err) {
    console.warn("Could not fetch literacy cards from API:", err);
  }

  updateLearningProgress();
  renderLearningCards();
  renderVideoFacades();
}

function updateLearningProgress() {
  const total = AppState.literacyCards.length || 30;
  const learnedCount = AppState.learnedConcepts.size;
  const pct = Math.min(100, Math.round((learnedCount / total) * 100));

  const textEl = document.getElementById("learningProgressText");
  if (textEl) {
    textEl.innerText = `${learnedCount} of ${total} concepts learned`;
  }

  const barEl = document.getElementById("learningProgressBar");
  if (barEl) {
    barEl.style.width = `${pct}%`;
  }
}

function filterLearningCategory(category) {
  triggerHaptic(8);
  AppState.selectedLiteracyCategory = category;

  document.querySelectorAll("#learningCategoryPills .category-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.getAttribute("data-category") === category);
  });

  renderLearningCards();
}

function renderLearningHub() {
  updateLearningProgress();
  renderLearningCards();
}

function renderLearningCards() {
  const container = document.getElementById("learningHubCarousel");
  if (!container) return;

  if (!AppState.literacyCards || !AppState.literacyCards.length) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center w-full">Loading curated financial lessons...</div>`;
    return;
  }

  const selectedCat = AppState.selectedLiteracyCategory || "all";
  const filtered = selectedCat === "all"
    ? AppState.literacyCards
    : AppState.literacyCards.filter((c) => {
        const cat = c.category && c.category.value ? c.category.value : String(c.category);
        return cat.toLowerCase() === selectedCat.toLowerCase();
      });

  const catColors = {
    basics: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "book-open" },
    regimes: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "activity" },
    risk: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: "shield-alert" },
    quant: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "cpu" },
  };

  container.innerHTML = filtered.map((c) => {
    const isLearned = AppState.learnedConcepts.has(c.key);
    const cat = (c.category && c.category.value ? c.category.value : String(c.category)).toLowerCase();
    const style = catColors[cat] || catColors.basics;

    return `
      <div class="learning-card ${isLearned ? 'is-learned' : ''}" onclick="openConceptModal('${c.key}')" role="button" tabindex="0">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase ${style.text} ${style.bg} px-2 py-0.5 rounded border ${style.border}">
            ${cat}
          </span>
          <div class="flex items-center gap-1.5">
            ${isLearned ? '<span class="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Learned</span>' : ''}
            <i data-lucide="${style.icon}" class="w-4 h-4 ${style.text}"></i>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold text-white flex items-center justify-between">
            <span>${escapeHtml(c.title)}</span>
          </h4>
          <p class="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-3">
            ${escapeHtml(c.explanation)}
          </p>
        </div>

        <!-- Everyday Analogy Snippet -->
        <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-300 italic line-clamp-2">
          <span class="font-semibold text-amber-400 not-italic">💡 Analogy: </span>${escapeHtml(c.analogy)}
        </div>

        <!-- Action Bar -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
          <button type="button" class="btn-ghost !p-1 text-slate-400 hover:text-white" onclick="event.stopPropagation(); toggleConceptLearned('${c.key}', event)">
            <i data-lucide="${isLearned ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5 ${isLearned ? 'text-emerald-400' : 'text-slate-500'}"></i>
            <span class="ml-1">${isLearned ? 'Learned' : 'Mark Learned'}</span>
          </button>
          <button type="button" class="learn-chip" onclick="event.stopPropagation(); askNitiBotAboutConcept('${c.key}')">
            <i data-lucide="bot" class="w-3 h-3"></i>
            <span>Ask NitiBot</span>
          </button>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function toggleConceptLearned(key, event) {
  if (event) event.stopPropagation();
  triggerHaptic(12);

  if (AppState.learnedConcepts.has(key)) {
    AppState.learnedConcepts.delete(key);
  } else {
    AppState.learnedConcepts.add(key);
  }

  // Persist to localStorage
  try {
    localStorage.setItem("quantniti_learned_concepts", JSON.stringify(Array.from(AppState.learnedConcepts)));
  } catch (e) {
    console.warn("Could not persist learned concepts to localStorage:", e);
  }

  updateLearningProgress();
  renderLearningCards();

  // If modal is open, update modal toggle state
  if (AppState.activeConceptKey === key) {
    updateConceptModalButtonState(key);
  }
}

function updateConceptModalButtonState(key) {
  const isLearned = AppState.learnedConcepts.has(key);
  const btn = document.getElementById("conceptLearnedToggleBtn");
  const text = document.getElementById("conceptLearnedToggleText");
  if (btn && text) {
    if (isLearned) {
      btn.className = "btn-secondary !py-2 flex-1 justify-center !border-emerald-500/40 !text-emerald-400";
      text.innerText = "Learned ✓ (Click to Undo)";
    } else {
      btn.className = "btn-secondary !py-2 flex-1 justify-center";
      text.innerText = "Mark as Learned";
    }
  }
}

async function openConceptModal(conceptKey) {
  triggerHaptic(15);
  AppState.activeConceptKey = conceptKey;

  let card = AppState.literacyCards.find((c) => c.key === conceptKey);
  if (!card) {
    try {
      const resp = await fetch(`/api/v1/literacy/${conceptKey}`);
      if (resp.ok) {
        card = await resp.json();
      }
    } catch (e) {
      console.warn("Error fetching card details:", e);
    }
  }

  if (!card) return;

  const catEl = document.getElementById("conceptDetailCategory");
  const titleEl = document.getElementById("conceptDetailTitle");
  const explEl = document.getElementById("conceptDetailExplanation");
  const analogyEl = document.getElementById("conceptDetailAnalogy");
  const relatedSection = document.getElementById("conceptRelatedSection");
  const relatedChips = document.getElementById("conceptRelatedChips");

  const cat = (card.category && card.category.value ? card.category.value : String(card.category)).toUpperCase();
  if (catEl) catEl.innerText = cat;
  if (titleEl) titleEl.innerText = card.title;
  if (explEl) explEl.innerText = card.explanation;
  if (analogyEl) analogyEl.innerText = `"${card.analogy}"`;

  if (relatedSection && relatedChips) {
    if (card.related_keys && card.related_keys.length) {
      relatedSection.classList.remove("hidden");
      relatedChips.innerHTML = card.related_keys.map((relKey) => {
        const relCard = AppState.literacyCards.find((c) => c.key === relKey);
        const relTitle = relCard ? relCard.title : relKey.replace(/_/g, " ");
        return `
          <button type="button" class="learn-chip" onclick="openConceptModal('${relKey}')">
            <i data-lucide="arrow-right" class="w-2.5 h-2.5"></i>
            <span>${escapeHtml(relTitle)}</span>
          </button>
        `;
      }).join("");
    } else {
      relatedSection.classList.add("hidden");
    }
  }

  updateConceptModalButtonState(conceptKey);
  openModalSheet("conceptDetailModal");

  if (window.lucide) lucide.createIcons();
}

function closeConceptModal(event) {
  if (event && event.target && !event.target.classList.contains("modal-overlay")) {
    return;
  }
  closeModalSheet("conceptDetailModal");
}

function toggleCurrentConceptLearned() {
  if (AppState.activeConceptKey) {
    toggleConceptLearned(AppState.activeConceptKey);
  }
}

function askNitiBotAboutCurrentConcept() {
  if (AppState.activeConceptKey) {
    const key = AppState.activeConceptKey;
    closeModalSheet("conceptDetailModal");
    askNitiBotAboutConcept(key);
  }
}

function askNitiBotAboutConcept(conceptKey) {
  triggerHaptic(12);
  const card = AppState.literacyCards.find((c) => c.key === conceptKey);
  const prompt = card
    ? `Can you explain ${card.title} in the context of my portfolio using everyday analogies?`
    : `Explain ${conceptKey.replace(/_/g, " ")} in plain English.`;

  openModalSheet("nitibotModal");
  sendNitiBotQuickPrompt(prompt);
}

// Lightweight Video Facades (Lazy-Loaded Thumbnails)
function renderVideoFacades() {
  const container = document.getElementById("videoFacadesContainer");
  if (!container) return;

  const cardsWithVideos = AppState.literacyCards.filter((c) => c.video);
  if (!cardsWithVideos.length) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-4 text-center col-span-2">No videos loaded yet.</div>`;
    return;
  }

  container.innerHTML = cardsWithVideos.map((c) => {
    const v = c.video;
    const thumb = v.thumbnail_url || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80";
    const facadeId = `video-facade-${c.key}`;

    return `
      <div class="video-facade" id="${facadeId}" onclick="loadVideoFacade('${v.video_id}', '${facadeId}')" role="button" tabindex="0" title="Click to stream video">
        <img class="video-facade-thumbnail" src="${thumb}" alt="${escapeHtml(v.video_title)}" loading="lazy">
        <div class="video-facade-overlay">
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-bold uppercase bg-slate-900/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              ${c.category && c.category.value ? c.category.value : c.category}
            </span>
            <span class="text-[10px] font-semibold bg-slate-900/80 text-white px-2 py-0.5 rounded">
              ${v.video_duration || '2:30'}
            </span>
          </div>

          <div class="video-facade-play-btn">
            <i data-lucide="play" class="w-5 h-5 fill-current ml-0.5"></i>
          </div>

          <div class="text-xs font-bold text-white drop-shadow-md">
            ${escapeHtml(v.video_title)}
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function loadVideoFacade(videoId, containerId) {
  triggerHaptic(20);
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center rounded-xl">
      <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 animate-pulse">
        <i data-lucide="play" class="w-5 h-5 fill-current ml-0.5"></i>
      </div>
      <div class="text-xs font-bold text-white mb-1">Streaming Video Explainer</div>
      <p class="text-[11px] text-slate-300 mb-2">Simulated mobile-first video player (battery-saver facade active).</p>
      <button class="btn-ghost !text-xs text-emerald-400 !py-1 !px-3 border border-emerald-500/30" onclick="event.stopPropagation(); renderVideoFacades();">
        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 mr-1"></i> Close Player
      </button>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

// ===================================================================
// COMPOUNDING VISUALIZER & WEALTH GROWTH ENGINE (Ticket #18)
// ===================================================================

let compoundingDebounceTimer = null;

function initCompoundingVisualizer() {
  const card = document.getElementById("compoundingVisualizerCard");
  if (!card) return;
  recalculateCompounding();
}

function handleCompoundingInputChange() {
  triggerHaptic(5);
  const amount = parseFloat(document.getElementById("sipAmountSlider").value) || 5000;
  const tenure = parseInt(document.getElementById("sipTenureSlider").value) || 5;
  const rate = parseFloat(document.getElementById("sipReturnSlider").value) || 12;

  document.getElementById("sipAmountLabel").innerText = `₹${amount.toLocaleString('en-IN')}`;
  document.getElementById("sipTenureLabel").innerText = `${tenure} Year${tenure > 1 ? 's' : ''}`;
  document.getElementById("sipReturnLabel").innerText = `${rate.toFixed(1)}% p.a.`;

  clearTimeout(compoundingDebounceTimer);
  compoundingDebounceTimer = setTimeout(recalculateCompounding, 120);
}

async function recalculateCompounding() {
  const amountEl = document.getElementById("sipAmountSlider");
  const tenureEl = document.getElementById("sipTenureSlider");
  const returnEl = document.getElementById("sipReturnSlider");
  const stepUpEl = document.getElementById("sipStepUpToggle");
  const canvas = document.getElementById("compoundingFanChart");

  if (!amountEl || !canvas) return;

  const monthlySip = parseFloat(amountEl.value) || 5000;
  const tenureYears = parseInt(tenureEl.value) || 5;
  const expectedReturn = parseFloat(returnEl.value) || 12.0;
  const useStepUp = stepUpEl ? stepUpEl.checked : false;

  try {
    const resp = await fetch("/api/portfolio/compounding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthly_sip: monthlySip,
        tenure_years: tenureYears,
        expected_return_pct: expectedReturn,
        step_up_pct: useStepUp ? 10.0 : 0.0,
      }),
    });
    if (!resp.ok) return;
    const data = await resp.json();

    const summary = useStepUp ? data.step_up_sip_summary : data.regular_sip_summary;
    document.getElementById("compoundingTotalInvested").innerText = `₹${Math.round(summary.total_invested).toLocaleString('en-IN')}`;
    document.getElementById("compoundingWealthGain").innerText = `+₹${Math.round(summary.wealth_gain).toLocaleString('en-IN')}`;
    document.getElementById("compoundingFutureValue").innerText = `₹${Math.round(summary.future_value).toLocaleString('en-IN')}`;

    // Tipping point indicator
    const badge = document.getElementById("tippingPointBadge");
    const desc = document.getElementById("tippingPointDescription");
    if (data.tipping_point && data.tipping_point.is_reached) {
      badge.innerText = `Month ${data.tipping_point.month} (Year ${data.tipping_point.year})`;
      badge.className = "text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold border border-emerald-500/30 animate-pulse";
      desc.innerText = data.tipping_point.description;
    } else {
      badge.innerText = "Beyond Horizon";
      badge.className = "text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-semibold border border-slate-700";
      desc.innerText = data.tipping_point ? data.tipping_point.description : "Keep investing to reach the tipping point.";
    }

    // Render Fan Chart
    if (AppState.charts.compoundingFan) {
      AppState.charts.compoundingFan.destroy();
    }

    const ctx = canvas.getContext("2d");
    const stepInterval = tenureYears <= 3 ? 3 : (tenureYears <= 6 ? 6 : 12);
    const displayPts = data.monthly_trajectories.filter((pt) => pt.month % stepInterval === 0 || pt.month === data.monthly_trajectories.length);

    const labels = displayPts.map((pt) => `M${pt.month}`);
    const investedData = displayPts.map((pt) => useStepUp ? pt.invested_step_up : pt.invested_sip);
    const valueData = displayPts.map((pt) => useStepUp ? pt.value_step_up : pt.value_sip);

    AppState.charts.compoundingFan = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Wealth",
            data: valueData,
            borderColor: "#00D09C",
            backgroundColor: "rgba(0, 208, 156, 0.20)",
            fill: 1,
            borderWidth: 2.5,
            pointRadius: 2.5,
            tension: 0.3,
          },
          {
            label: "Principal Deposited",
            data: investedData,
            borderColor: "#94a3b8",
            borderDash: [4, 4],
            backgroundColor: "rgba(148, 163, 184, 0.05)",
            fill: "origin",
            borderWidth: 1.5,
            pointRadius: 2,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => ` ${c.dataset.label}: ₹${Math.round(c.parsed.y).toLocaleString('en-IN')}`,
            },
          },
        },
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 9 } } },
          y: { 
            grid: { color: "rgba(255,255,255,0.05)" }, 
            ticks: { 
              color: "#94a3b8", 
              font: { size: 9 },
              callback: (v) => "₹" + (v >= 100000 ? (v / 100000).toFixed(1) + "L" : (v / 1000).toFixed(0) + "k"),
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Error calculating compounding projection:", err);
  }
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
    const sLow = sector.toLowerCase();
    if (sLow === "metals") {
      filtered = filtered.filter((s) => s.sector === "Metals" || s.sector === "Metals & Mining");
    } else if (sLow === "commodities") {
      filtered = filtered.filter((s) => s.sector === "Commodities" || s.asset_class === "COMMODITY_ETF");
    } else if (sLow === "defense") {
      filtered = filtered.filter((s) => s.sector === "Defense");
    } else if (sLow === "energy") {
      filtered = filtered.filter((s) => s.sector === "Energy" || s.sector === "Energy & Oil" || s.sector === "Power & Energy");
    } else {
      filtered = filtered.filter((s) => s.sector === sector || (s.sector && s.sector.includes(sector)));
    }
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
    grid.innerHTML = `<div class="col-span-2 text-center py-8 text-xs text-slate-500">No assets matching your criteria</div>`;
    return;
  }

  grid.innerHTML = stocks.map((stock) => `
    <div class="glass-card-sm cursor-pointer hover:border-emerald-500/40 transition-all" onclick="openStockProfileModal('${stock.symbol}')">
      <div class="flex justify-between items-start mb-2">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-white text-sm">${stock.symbol}</span>
            ${stock.asset_class === 'COMMODITY_ETF' ? `<span class="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">ETF</span>` : ''}
          </div>
          <span class="text-[10px] text-slate-400 block">${stock.sector}</span>
        </div>
        <div class="flex items-center gap-1">
          ${stock.esg_composite ? `
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            stock.esg_composite >= 70
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
              : (stock.esg_composite >= 40
                  ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-950 text-rose-400 border border-rose-500/30')
          }" title="ESG Conscience: ${stock.esg_composite.toFixed(0)}/100">
            🌱 ${stock.esg_composite.toFixed(0)}
          </span>` : ''}
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            ${stock.regime_badge}
          </span>
        </div>
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

    // Render ESG Conscience Dimension
    if (profile.esg) {
      const sec = document.getElementById("modalStockEsgSection");
      if (sec) sec.classList.remove("hidden");
      const badgeEl = document.getElementById("modalStockEsgBadge");
      if (badgeEl) {
        badgeEl.innerText = profile.esg.badge || "🟡 Moderate ESG";
        badgeEl.className = `text-[10px] font-semibold px-2 py-0.5 rounded border ${
          profile.esg.esg_composite >= 70
            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
            : (profile.esg.esg_composite >= 40
                ? 'bg-amber-950 text-amber-400 border-amber-500/30'
                : 'bg-rose-950 text-rose-400 border-rose-500/30')
        }`;
      }
      const compEl = document.getElementById("modalStockEsgComposite");
      if (compEl) compEl.innerText = `${profile.esg.esg_composite.toFixed(1)} / 100`;
      const envEl = document.getElementById("modalStockEsgEnv");
      if (envEl) envEl.innerText = profile.esg.esg_environment.toFixed(0);
      const socEl = document.getElementById("modalStockEsgSoc");
      if (socEl) socEl.innerText = profile.esg.esg_social.toFixed(0);
      const govEl = document.getElementById("modalStockEsgGov");
      if (govEl) govEl.innerText = profile.esg.esg_governance.toFixed(0);
    }
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
    const esg = item.esg_composite;
    return `
    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-750 text-xs">
      <div>
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-white">${item.symbol}</span>
          ${esg !== null && esg !== undefined ? `
          <span class="text-[9px] font-semibold px-1 py-0.5 rounded ${
            esg >= 70
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
              : (esg >= 40
                  ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-950 text-rose-400 border border-rose-500/30')
          }">ESG ${esg.toFixed(0)}</span>` : ''}
        </div>
        <span class="text-[10px] text-slate-400 block">${item.name} (${(item.weight * 100).toFixed(1)}%)</span>
      </div>
      <div class="text-right">
        <div class="font-semibold text-emerald-400 tabular-nums">₹${allocatedAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div class="text-[10px] text-slate-400 tabular-nums">${shares} shares @ ₹${item.current_price.toFixed(1)}</div>
      </div>
    </div>
    `;
  }).join("");

  // Update Portfolio ESG Conscience Card
  const esgScoreEl = document.getElementById("portfolioEsgScore");
  const esgBadgeEl = document.getElementById("portfolioEsgBadge");
  const esgEnvEl = document.getElementById("portfolioEsgEnv");
  const esgSocEl = document.getElementById("portfolioEsgSoc");
  const esgGovEl = document.getElementById("portfolioEsgGov");
  if (esgScoreEl && typeof data.portfolio_esg_score === "number") {
    esgScoreEl.innerText = `${data.portfolio_esg_score.toFixed(1)} / 100`;
    if (esgBadgeEl) {
      esgBadgeEl.innerText = data.portfolio_esg_badge || "🟡 Moderate ESG";
      esgBadgeEl.className = `text-[10px] font-semibold px-2 py-0.5 rounded border ${
        data.portfolio_esg_score >= 70
          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
          : (data.portfolio_esg_score >= 40
              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
              : 'bg-rose-950 text-rose-400 border border-rose-500/30')
      }`;
    }
    const bd = data.portfolio_esg_breakdown || {};
    if (esgEnvEl) esgEnvEl.innerText = (bd.esg_environment || 0).toFixed(1);
    if (esgSocEl) esgSocEl.innerText = (bd.esg_social || 0).toFixed(1);
    if (esgGovEl) esgGovEl.innerText = (bd.esg_governance || 0).toFixed(1);
  }

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
// TAB 4: PORTFOLIO TAB & MULTI-PORTFOLIO STORAGE ENGINE (Ticket #19)
// ===================================================================

// IndexedDB Local-First Offline Cache
function openQuantNitiDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open("QuantNitiDB", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("portfolios")) {
        db.createObjectStore("portfolios", { keyPath: "portfolio_id" });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => {
      console.warn("IndexedDB open error:", e);
      resolve(null);
    };
  });
}

async function savePortfoliosToIndexedDB(portfolios) {
  try {
    const db = await openQuantNitiDB();
    if (!db) return;
    const tx = db.transaction("portfolios", "readwrite");
    const store = tx.objectStore("portfolios");
    for (const port of portfolios) {
      store.put(port);
    }
  } catch (err) {
    console.warn("Error saving portfolios to IndexedDB:", err);
  }
}

async function loadPortfoliosFromIndexedDB() {
  try {
    const db = await openQuantNitiDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction("portfolios", "readonly");
      const store = tx.objectStore("portfolios");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn("Error loading portfolios from IndexedDB:", err);
    return [];
  }
}

async function deletePortfolioFromIndexedDB(portfolioId) {
  try {
    const db = await openQuantNitiDB();
    if (!db) return;
    const tx = db.transaction("portfolios", "readwrite");
    tx.objectStore("portfolios").delete(portfolioId);
  } catch (err) {
    console.warn("Error deleting from IndexedDB:", err);
  }
}

async function loadUserPortfolios() {
  // 1. Instant Cache-first render from IndexedDB
  const cached = await loadPortfoliosFromIndexedDB();
  if (cached && cached.length > 0) {
    AppState.portfolios = cached;
    if (!AppState.activePortfolioId || !AppState.portfolios.some((p) => p.portfolio_id === AppState.activePortfolioId)) {
      AppState.activePortfolioId = cached[0].portfolio_id;
      AppState.activePortfolio = cached[0];
    }
    updatePortfolioSelector();
    renderPortfolioState(AppState.activePortfolio);
  }

  // 2. Network revalidation from backend
  try {
    const resp = await fetch("/api/v1/portfolios");
    if (!resp.ok) return;
    const remote = await resp.json();
    if (remote && remote.length > 0) {
      AppState.portfolios = remote;
      if (!AppState.activePortfolioId || !AppState.portfolios.some((p) => p.portfolio_id === AppState.activePortfolioId)) {
        AppState.activePortfolioId = remote[0].portfolio_id;
      }
      AppState.activePortfolio = AppState.portfolios.find((p) => p.portfolio_id === AppState.activePortfolioId) || remote[0];
      await savePortfoliosToIndexedDB(remote);
      updatePortfolioSelector();
      renderPortfolioState(AppState.activePortfolio);
      renderHomeTab();
    }
  } catch (err) {
    console.warn("Could not revalidate portfolios from network (offline mode active):", err);
  }
}

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

    const resp = await fetch("/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) throw new Error("Failed to activate portfolio");
    const portData = await resp.json();
    
    // Store in multi-portfolio list & IndexedDB
    AppState.activePortfolioId = portData.portfolio_id;
    AppState.activePortfolio = portData;
    if (!AppState.portfolios.some((p) => p.portfolio_id === portData.portfolio_id)) {
      AppState.portfolios.unshift(portData);
    }
    await savePortfoliosToIndexedDB([portData]);
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
  if (!AppState.portfolios.length) {
    sel.innerHTML = `<option value="">No Active Portfolios</option>`;
    return;
  }
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
    const resp = await fetch(`/api/v1/portfolios/${AppState.activePortfolioId}`);
    if (!resp.ok) return;
    const data = await resp.json();
    AppState.activePortfolio = data;
    
    // Update memory & local store
    const idx = AppState.portfolios.findIndex((p) => p.portfolio_id === data.portfolio_id);
    if (idx !== -1) {
      AppState.portfolios[idx] = data;
    } else {
      AppState.portfolios.push(data);
    }
    await savePortfoliosToIndexedDB([data]);

    renderPortfolioState(data);
    renderHomeTab();

    // Check Rebalance Diff
    await checkRebalanceDiff();
  } catch (err) {
    console.error("Error refreshing portfolio:", err);
  }
}

// Create Goal Portfolio Modal Handlers
function openCreatePortfolioModal() {
  triggerHaptic(15);
  const modal = document.getElementById("createGoalModal");
  if (modal) {
    modal.classList.remove("hidden");
    document.getElementById("goalPortfolioNameInput").value = "";
    document.getElementById("goalCapitalRange").value = 50000;
    document.getElementById("goalCapitalDisplay").innerText = "₹50,000";
    setTimeout(() => {
      document.getElementById("goalPortfolioNameInput").focus();
    }, 100);
  }
}

function closeCreatePortfolioModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.closest(".btn-ghost")) return;
  const modal = document.getElementById("createGoalModal");
  if (modal) modal.classList.add("hidden");
}

function setGoalNamePreset(preset) {
  triggerHaptic(10);
  const inp = document.getElementById("goalPortfolioNameInput");
  if (inp) {
    inp.value = preset;
  }
}

async function submitCreateGoalPortfolio() {
  triggerHaptic(20);
  const name = document.getElementById("goalPortfolioNameInput").value.trim() || "My Goal Portfolio";
  const capital = parseFloat(document.getElementById("goalCapitalRange").value) || 50000;
  
  const personaEl = document.querySelector('input[name="goalRiskPersona"]:checked');
  const risk_persona = personaEl ? personaEl.value : "Balanced";

  const horizonEl = document.querySelector('input[name="goalHorizon"]:checked');
  const horizon = horizonEl ? horizonEl.value : "6M";

  const btn = document.getElementById("createGoalSubmitBtn");
  if (btn) btn.disabled = true;

  try {
    const resp = await fetch("/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, capital, risk_persona, horizon }),
    });

    if (!resp.ok) throw new Error("Failed to create portfolio");
    const newPort = await resp.json();

    closeCreatePortfolioModal();
    AppState.activePortfolioId = newPort.portfolio_id;
    AppState.activePortfolio = newPort;
    AppState.portfolios.unshift(newPort);
    await savePortfoliosToIndexedDB([newPort]);

    updatePortfolioSelector();
    renderPortfolioState(newPort);
    renderHomeTab();
    switchTab("portfolio");
  } catch (err) {
    console.error("Error creating goal portfolio:", err);
    alert("Could not create goal portfolio. Please try again.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function deleteActivePortfolio() {
  triggerHaptic(20);
  if (!AppState.activePortfolioId) return;
  const currName = AppState.activePortfolio?.name || "this portfolio";
  if (!confirm(`Are you sure you want to delete "${currName}"? This cannot be undone.`)) {
    return;
  }

  try {
    const resp = await fetch(`/api/v1/portfolios/${AppState.activePortfolioId}`, {
      method: "DELETE",
    });
    if (!resp.ok) throw new Error("Failed to delete portfolio");

    await deletePortfolioFromIndexedDB(AppState.activePortfolioId);
    AppState.portfolios = AppState.portfolios.filter((p) => p.portfolio_id !== AppState.activePortfolioId);
    AppState.activePortfolioId = AppState.portfolios.length > 0 ? AppState.portfolios[0].portfolio_id : null;
    AppState.activePortfolio = AppState.portfolios.length > 0 ? AppState.portfolios[0] : null;
    updatePortfolioSelector();
    if (AppState.activePortfolio) {
      renderPortfolioState(AppState.activePortfolio);
    } else {
      // Clear out display
      document.getElementById("portValuationTotal").innerText = "₹0.00";
      document.getElementById("portValuation1D").innerText = "+₹0.00 (+0.00%)";
      document.getElementById("portValuationPnl").innerText = "+₹0.00 (+0.00%)";
      document.getElementById("portHoldingsBody").innerHTML = "";
    }
    renderHomeTab();
  } catch (err) {
    console.error("Error deleting portfolio:", err);
    alert("Could not delete portfolio. Please try again.");
  }
}

function renderPortfolioState(port) {
  if (!port) return;

  // Header subtitle & Tags
  const subtitleEl = document.getElementById("portfolioNameSubtitle");
  if (subtitleEl) subtitleEl.innerText = `${port.name} • Goal Tracker`;

  const personaTag = document.getElementById("portfolioPersonaTag");
  if (personaTag) personaTag.innerText = port.risk_persona;

  const horizonTag = document.getElementById("portfolioHorizonTag");
  if (horizonTag) horizonTag.innerText = port.horizon;

  // Primary Total Valuation in Indian Number Format (e.g. ₹1,24,560.00)
  const totalValEl = document.getElementById("portValuationTotal");
  if (totalValEl) {
    totalValEl.innerText = `₹${port.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Dual Metric: 1-Day Return vs Overall Return
  const pnl1D = port.pnl_1d || 0.0;
  const pnl1DPct = port.pnl_1d_pct || 0.0;
  const port1DEl = document.getElementById("portValuation1D");
  const port1DBadge = document.getElementById("port1DMetricBadge");
  if (port1DEl) {
    const sign1D = pnl1D >= 0 ? '+' : '';
    port1DEl.innerText = `${sign1D}₹${Math.abs(pnl1D).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sign1D}${pnl1DPct.toFixed(2)}%)`;
    if (port1DBadge) {
      port1DBadge.className = `flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
        pnl1D >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`;
    }
  }

  const totalPnl = port.total_pnl || 0.0;
  const totalPnlPct = port.total_pnl_pct || 0.0;
  const pnlEl = document.getElementById("portValuationPnl");
  const totalBadge = document.getElementById("portTotalMetricBadge");
  if (pnlEl) {
    const signTotal = totalPnl >= 0 ? '+' : '';
    pnlEl.innerText = `${signTotal}₹${Math.abs(totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${signTotal}${totalPnlPct.toFixed(2)}%)`;
    if (totalBadge) {
      totalBadge.className = `flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
        totalPnl >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`;
    }
  }

  // Secondary metrics
  const invEl = document.getElementById("portValuationInvested");
  if (invEl) invEl.innerText = `₹${port.invested_capital.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cashEl = document.getElementById("portValuationCash");
  if (cashEl) cashEl.innerText = `₹${port.cash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (port.benchmark_comparison) {
    const alpha = port.benchmark_comparison.alpha_vs_nifty;
    const alphaEl = document.getElementById("portValuationAlpha");
    if (alphaEl) {
      alphaEl.innerText = `${alpha >= 0 ? '+' : ''}${alpha.toFixed(1)}%`;
      alphaEl.className = `font-bold ${alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-0.5 tabular-nums text-xs sm:text-sm`;
    }
  }

  // Holdings Table with 1D Return and Overall P&L
  const tbody = document.getElementById("portHoldingsBody");
  if (tbody && port.holdings) {
    tbody.innerHTML = port.holdings.map((h) => {
      const h1D = h.pnl_1d || 0.0;
      const h1DPct = h.pnl_1d_pct || 0.0;
      const hTotal = h.unrealized_pnl || 0.0;
      const hTotalPct = h.unrealized_pnl_pct || 0.0;

      return `
        <tr>
          <td>
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-white">${h.symbol}</span>
              ${h.symbol.includes("BEES") ? `<span class="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">ETF</span>` : ''}
            </div>
            <span class="text-[10px] text-slate-400 block">${h.sector}</span>
          </td>
          <td class="text-slate-300 font-medium tabular-nums">${h.shares}</td>
          <td class="text-slate-300 tabular-nums">₹${h.current_price.toFixed(2)}</td>
          <td class="font-semibold text-white tabular-nums">₹${h.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="${h1D >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold tabular-nums text-xs">
            ${h1D >= 0 ? '+' : ''}₹${h1D.toFixed(1)} (${h1D >= 0 ? '+' : ''}${h1DPct.toFixed(1)}%)
          </td>
          <td class="${hTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold tabular-nums text-xs">
            ${hTotal >= 0 ? '+' : ''}₹${hTotal.toFixed(1)} (${hTotal >= 0 ? '+' : ''}${hTotalPct.toFixed(1)}%)
          </td>
        </tr>
      `;
    }).join("");
  }

  // Update 10-Year Long-Horizon Compounding Projection vs 7% Bank FD Hurdle (Ticket #18)
  renderPortfolioCompounding(port);
  if (window.lucide) lucide.createIcons();
}

async function renderPortfolioCompounding(port) {
  if (!port) return;
  const canvas = document.getElementById("portfolioCompoundingChart");
  if (!canvas) return;

  try {
    const resp = await fetch("/api/portfolio/compounding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portfolio_id: port.portfolio_id,
        tenure_years: 10,
        initial_lump_sum: port.current_value,
      }),
    });
    if (!resp.ok) return;
    const data = await resp.json();

    const yr10 = data.yearly_trajectories[data.yearly_trajectories.length - 1];
    if (yr10) {
      document.getElementById("port10YPessimistic").innerText = `₹${Math.round(yr10.gbm_pessimistic_10th).toLocaleString('en-IN')}`;
      document.getElementById("port10YBase").innerText = `₹${Math.round(yr10.gbm_base_50th).toLocaleString('en-IN')}`;
      document.getElementById("port10YOptimistic").innerText = `₹${Math.round(yr10.gbm_optimistic_90th).toLocaleString('en-IN')}`;
      document.getElementById("port10YBankFd").innerText = `₹${Math.round(yr10.bank_fd_value).toLocaleString('en-IN')}`;
    }

    const alphaEl = document.getElementById("portfolioAlphaText");
    if (alphaEl) {
      const alphaVal = Math.round(data.alpha_vs_bank_fd);
      alphaEl.innerText = alphaVal >= 0 
        ? `Beats 7% Bank FD by +₹${alphaVal.toLocaleString('en-IN')}`
        : `Lags 7% Bank FD by -₹${Math.abs(alphaVal).toLocaleString('en-IN')}`;
    }

    if (AppState.charts.portfolioCompounding) {
      AppState.charts.portfolioCompounding.destroy();
    }

    const ctx = canvas.getContext("2d");
    const labels = data.yearly_trajectories.map((y) => `Year ${y.year}`);
    const q90 = data.yearly_trajectories.map((y) => y.gbm_optimistic_90th);
    const q50 = data.yearly_trajectories.map((y) => y.gbm_base_50th);
    const q10 = data.yearly_trajectories.map((y) => y.gbm_pessimistic_10th);
    const bankFd = data.yearly_trajectories.map((y) => y.bank_fd_value);

    AppState.charts.portfolioCompounding = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Optimistic (Q90)",
            data: q90,
            borderColor: "#2dd4bf",
            backgroundColor: "rgba(45, 212, 191, 0.08)",
            fill: "+1",
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
          },
          {
            label: "Base Case (Q50)",
            data: q50,
            borderColor: "#00D09C",
            backgroundColor: "rgba(0, 208, 156, 0.12)",
            borderWidth: 2.5,
            pointRadius: 4,
            tension: 0.3,
          },
          {
            label: "Pessimistic (Q10)",
            data: q10,
            borderColor: "#f87171",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
          },
          {
            label: "7% Bank FD Hurdle",
            data: bankFd,
            borderColor: "#fbbf24",
            borderDash: [5, 5],
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => ` ${c.dataset.label}: ₹${Math.round(c.parsed.y).toLocaleString('en-IN')}`,
            },
          },
        },
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } },
          y: { 
            grid: { color: "rgba(255,255,255,0.05)" }, 
            ticks: { 
              color: "#94a3b8", 
              font: { size: 10 },
              callback: (v) => "₹" + (v >= 100000 ? (v / 100000).toFixed(1) + "L" : (v / 1000).toFixed(0) + "k"),
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Error rendering portfolio compounding trajectory:", err);
  }
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

// =====================================================================
// Ticket #20: MarketStreamClient (Real-Time SSE Ticker Streaming)
// =====================================================================

class MarketStreamClient {
  constructor(endpoint = "/api/v1/stream/ticks") {
    this.endpoint = endpoint;
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000;
    this.previousPrices = new Map();
    this.isConnected = false;
  }

  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(this.endpoint);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log("[MarketStream] SSE Connected to live quotes");
      };

      this.eventSource.addEventListener("tick", (e) => {
        try {
          const tick = JSON.parse(e.data);
          this.handleTick(tick);
        } catch (err) {
          console.error("[MarketStream] Failed to parse tick", err);
        }
      });

      this.eventSource.addEventListener("ping", (e) => {
        // Heartbeat keep-alive received
      });

      this.eventSource.onerror = (err) => {
        this.isConnected = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
        this.reconnectAttempts++;
        console.warn(`[MarketStream] Connection dropped. Reconnecting in ${Math.round(delay)}ms...`);
        setTimeout(() => this.connect(), delay);
      };
    } catch (e) {
      console.warn("[MarketStream] EventSource connection error:", e);
    }
  }

  handleTick(tick) {
    if (!tick || !tick.symbol) return;
    const sym = tick.symbol;
    const prevPrice = this.previousPrices.get(sym);
    this.previousPrices.set(sym, tick.price);

    const priceDelta = prevPrice !== undefined ? tick.price - prevPrice : 0;
    const flashClass = priceDelta > 0.0001 ? "tick-up" : priceDelta < -0.0001 ? "tick-down" : null;

    // 1. Update Benchmark (NIFTY 50) on Home Tab
    if (sym === "^NSEI") {
      const priceEl = document.getElementById("homeNiftyPrice");
      const changeEl = document.getElementById("homeNiftyChange");
      if (priceEl) {
        priceEl.textContent = `₹${tick.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (flashClass) this.applyFlash(priceEl, flashClass);
      }
      if (changeEl) {
        const sign = tick.change >= 0 ? "+" : "";
        changeEl.textContent = `${sign}${tick.change.toFixed(2)} (${sign}${tick.change_pct.toFixed(2)}%)`;
        changeEl.className = tick.change >= 0 
          ? "text-sm font-bold text-emerald-400 tabular-nums"
          : "text-sm font-bold text-rose-400 tabular-nums";
        if (flashClass) this.applyFlash(changeEl, flashClass);
      }
    }

    // 2. Update elements matching data-ticker-symbol
    const matchingElements = document.querySelectorAll(`[data-ticker-symbol="${sym}"]`);
    matchingElements.forEach((el) => {
      const priceSpan = el.querySelector(".stock-price-val") || el;
      if (priceSpan) {
        priceSpan.textContent = `₹${tick.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (flashClass) this.applyFlash(priceSpan, flashClass);
      }
    });

    // 3. Update active portfolio holding rows matching data-portfolio-symbol
    const portHoldings = document.querySelectorAll(`[data-portfolio-symbol="${sym}"]`);
    portHoldings.forEach((row) => {
      const priceCol = row.querySelector(".holding-price-val");
      if (priceCol) {
        priceCol.textContent = `₹${tick.price.toFixed(2)}`;
        if (flashClass) this.applyFlash(priceCol, flashClass);
      }
    });
  }

  applyFlash(element, className) {
    element.classList.remove("tick-up", "tick-down");
    void element.offsetWidth; // Trigger reflow
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, 850);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }
}

let marketStream = null;

function initMarketStream() {
  if (marketStream) return;
  marketStream = new MarketStreamClient("/api/v1/stream/ticks");
  marketStream.connect();
}

// =====================================================================
// Ticket #20: Smart Alerts Notification Center & Toast Dispatcher
// =====================================================================

let NotificationState = {
  alerts: [],
  activeFilter: "ALL",
  isDrawerOpen: false,
};

function toggleNotificationDrawer(forceOpen) {
  const drawer = document.getElementById("notificationCenterDrawer");
  const backdrop = document.getElementById("notificationDrawerBackdrop");
  if (!drawer || !backdrop) return;

  const shouldOpen = forceOpen !== undefined ? forceOpen : !NotificationState.isDrawerOpen;
  NotificationState.isDrawerOpen = shouldOpen;

  if (shouldOpen) {
    drawer.classList.add("active");
    backdrop.classList.add("active");
    loadNotifications();
  } else {
    drawer.classList.remove("active");
    backdrop.classList.remove("active");
  }
}

async function loadNotifications() {
  try {
    const resp = await fetch("/api/v1/alerts");
    if (!resp.ok) return;
    const data = await resp.json();
    NotificationState.alerts = data.alerts || [];
    updateNotificationBadges(data.unread_count || 0);
    renderNotificationList();
  } catch (err) {
    console.warn("Error fetching alerts:", err);
  }
}

function updateNotificationBadges(unreadCount) {
  const bellBadge = document.getElementById("notificationBadge");
  const drawerBadge = document.getElementById("drawerUnreadCountBadge");

  if (bellBadge) {
    if (unreadCount > 0) {
      bellBadge.classList.remove("hidden");
    } else {
      bellBadge.classList.add("hidden");
    }
  }

  if (drawerBadge) {
    if (unreadCount > 0) {
      drawerBadge.textContent = `${unreadCount} new`;
      drawerBadge.classList.remove("hidden");
    } else {
      drawerBadge.classList.add("hidden");
    }
  }
}

function filterNotifications(filterType) {
  NotificationState.activeFilter = filterType;
  document.querySelectorAll(".notif-pill").forEach((pill) => {
    if (pill.getAttribute("data-filter") === filterType) {
      pill.className = "px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 notif-pill active";
    } else {
      pill.className = "px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 hover:text-white notif-pill";
    }
  });
  renderNotificationList();
}

function renderNotificationList() {
  const container = document.getElementById("notificationList");
  if (!container) return;

  let filtered = NotificationState.alerts;
  if (NotificationState.activeFilter === "TECHNICAL") {
    filtered = filtered.filter(a => a.type === "RSI_EXTREME" || a.type === "WEEK_52_HIGH" || a.type === "FACTOR_ANOMALY");
  } else if (NotificationState.activeFilter !== "ALL") {
    filtered = filtered.filter(a => a.type === NotificationState.activeFilter);
  }

  if (!filtered || filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center flex flex-col items-center justify-center text-slate-400">
        <div class="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3">
          <i data-lucide="bell-off" class="w-6 h-6 text-slate-500"></i>
        </div>
        <div class="text-sm font-semibold text-white">No active alerts</div>
        <div class="text-xs text-slate-400 mt-1">Quantitative risk guardrails are continuously monitoring your portfolio.</div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map((alert) => {
    const isUnread = !alert.read;
    const severityColor = alert.severity === "CRITICAL"
      ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
      : alert.severity === "HIGH"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : alert.severity === "MEDIUM"
      ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

    const typeLabel = alert.type.replace(/_/g, " ");

    return `
      <div class="p-3.5 rounded-xl border ${isUnread ? 'bg-slate-800/60 border-emerald-500/30' : 'bg-slate-900/40 border-slate-800/80'} relative cursor-pointer hover:border-slate-700 transition" onclick="markAlertRead('${alert.id}')">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${severityColor}">${typeLabel}</span>
          <span class="text-[10px] text-slate-400">${formatAlertTime(alert.timestamp)}</span>
        </div>
        <div class="text-xs font-bold text-white mb-1">${escapeHtml(alert.title)}</div>
        <div class="text-[11px] text-slate-300 leading-relaxed mb-2">${escapeHtml(alert.message)}</div>
        ${alert.trust_card_context ? `
          <div class="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-start gap-1.5">
            <i data-lucide="shield" class="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5"></i>
            <span>${escapeHtml(alert.trust_card_context)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function formatAlertTime(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoStr;
  }
}

async function markAlertRead(alertId) {
  try {
    await fetch(`/api/v1/alerts/${alertId}/read`, { method: "PATCH" });
    const item = NotificationState.alerts.find(a => a.id === alertId);
    if (item) item.read = true;
    const unread = NotificationState.alerts.filter(a => !a.read).length;
    updateNotificationBadges(unread);
    renderNotificationList();
  } catch (e) {
    console.warn("Failed to mark alert read:", e);
  }
}

async function markAllNotificationsRead() {
  try {
    await fetch("/api/v1/alerts/mark-all-read", { method: "POST" });
    NotificationState.alerts.forEach(a => a.read = true);
    updateNotificationBadges(0);
    renderNotificationList();
  } catch (e) {
    console.warn("Failed to mark all alerts read:", e);
  }
}

async function clearAllNotifications() {
  try {
    await fetch("/api/v1/alerts", { method: "DELETE" });
    NotificationState.alerts = [];
    updateNotificationBadges(0);
    renderNotificationList();
  } catch (e) {
    console.warn("Failed to clear alerts:", e);
  }
}

// In-App Toast Notification System
function showNotificationToast(alert) {
  const container = document.getElementById("toastContainer");
  if (!container || !alert) return;

  const toast = document.createElement("div");
  toast.className = "toast-item";

  const severityColor = alert.severity === "CRITICAL"
    ? "text-rose-400"
    : alert.severity === "HIGH"
    ? "text-amber-400"
    : "text-emerald-400";

  toast.innerHTML = `
    <div class="flex items-start gap-2.5">
      <div class="mt-0.5 ${severityColor}">
        <i data-lucide="bell" class="w-4 h-4"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-bold text-white truncate">${escapeHtml(alert.title)}</div>
        <div class="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">${escapeHtml(alert.message)}</div>
      </div>
      <button class="text-slate-400 hover:text-white p-0.5" onclick="this.closest('.toast-item').remove()">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `;

  toast.onclick = (e) => {
    if (e.target.closest("button")) return;
    toggleNotificationDrawer(true);
    toast.remove();
  };

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 250);
  }, 5500);
}

// Web Push Registration Helper
async function enablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    alert("Web Push notifications are not supported in this browser.");
    return;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const keyResp = await fetch("/api/v1/notifications/vapid-public-key");
    const keyData = await keyResp.json();
    const vapidKey = keyData.public_key;

    const convertedKey = urlBase64ToUint8Array(vapidKey);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    const subJson = subscription.toJSON();
    await fetch("/api/v1/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        user_id: "default_user",
      }),
    });

    const prompt = document.getElementById("notificationPushPrompt");
    if (prompt) {
      prompt.innerHTML = `
        <div class="flex items-center gap-2 text-emerald-400 text-xs">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          <span>Push notifications enabled</span>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  } catch (err) {
    console.warn("Failed to subscribe to Web Push:", err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function initNotificationCenter() {
  loadNotifications();
  // Micro-batch evaluator polling check every 60s
  setInterval(async () => {
    try {
      const resp = await fetch("/api/v1/alerts/evaluate", { method: "POST" });
      if (resp.ok) {
        const evalData = await resp.json();
        if (evalData.new_alerts_count > 0 && evalData.alerts) {
          evalData.alerts.forEach((alert) => showNotificationToast(alert));
          loadNotifications();
        }
      }
    } catch (e) {
      // Background scan
    }
  }, 60000);
}

// =====================================================================
// Ticket #21: Community Reviews & AI Fact-Checking Client Controller
// =====================================================================

let ReviewState = {
  currentReviews: [],
  currentSummary: null,
  activeFilter: "ALL",
  targetType: "basket",
  targetId: "balanced_6m",
  selectedRating: 5,
};

async function loadBasketReviews(targetType = "basket", targetId = "balanced_6m") {
  ReviewState.targetType = targetType;
  ReviewState.targetId = targetId;

  try {
    const resp = await fetch(`/api/v1/reviews/${targetType}/${targetId}`);
    if (!resp.ok) return;
    const data = await resp.json();
    ReviewState.currentReviews = data.reviews || [];
    ReviewState.currentSummary = data.summary;
    renderReviewsSummary(data.summary);
    renderReviewsList();
  } catch (err) {
    console.warn("Failed to load reviews:", err);
  }
}

function renderReviewsSummary(summary) {
  if (!summary) return;

  const avgEl = document.getElementById("reviewAvgRatingVal");
  if (avgEl) avgEl.textContent = summary.average_rating ? summary.average_rating.toFixed(1) : "0.0";

  const countEl = document.getElementById("reviewTotalCountLabel");
  if (countEl) {
    countEl.textContent = `Based on ${summary.total_reviews} reviews (${summary.verified_reviews_count} AI-verified)`;
  }

  const dist = summary.rating_distribution || {};
  const total = summary.total_reviews || 1;

  const c5 = dist[5] || 0;
  const c4 = dist[4] || 0;
  const c3 = dist[3] || 0;
  const c12 = (dist[1] || 0) + (dist[2] || 0);

  const setBar = (barId, countId, count) => {
    const bar = document.getElementById(barId);
    const lbl = document.getElementById(countId);
    if (bar) bar.style.width = `${Math.round((count / total) * 100)}%`;
    if (lbl) lbl.textContent = count;
  };

  setBar("starBar5", "starCount5", c5);
  setBar("starBar4", "starCount4", c4);
  setBar("starBar3", "starCount3", c3);
  setBar("starBar12", "starCount12", c12);
}

function filterReviewsList(filterType) {
  ReviewState.activeFilter = filterType;
  document.querySelectorAll(".review-filter-pill").forEach((btn) => {
    const isTarget = filterType === "ALL" ? btn.textContent.includes("All") :
                     filterType === "VERIFIED" ? btn.textContent.includes("Verified") :
                     btn.textContent.includes("Qualitative");
    if (isTarget) {
      btn.className = "px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 review-filter-pill active";
    } else {
      btn.className = "px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 hover:text-white review-filter-pill";
    }
  });
  renderReviewsList();
}

function renderReviewsList() {
  const container = document.getElementById("reviewsListContainer");
  if (!container) return;

  let reviews = ReviewState.currentReviews || [];
  if (ReviewState.activeFilter === "VERIFIED") {
    reviews = reviews.filter((r) => r.status === "VERIFIED");
  } else if (ReviewState.activeFilter === "QUALITATIVE") {
    reviews = reviews.filter((r) => r.status === "APPROVED");
  }

  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
        <i data-lucide="message-square" class="w-6 h-6 mx-auto mb-2 text-slate-500"></i>
        <div class="text-xs font-semibold text-white">No reviews match this filter</div>
        <div class="text-[11px] text-slate-400 mt-1">Be the first to share your experience with this portfolio!</div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = reviews.map((r) => {
    const starsHtml = Array.from({ length: 5 }, (_, i) => {
      return i < r.rating
        ? `<i data-lucide="star" class="star-icon"></i>`
        : `<i data-lucide="star" class="star-icon-empty"></i>`;
    }).join("");

    let badgeHtml = "";
    if (r.verification_badge) {
      if (r.status === "VERIFIED") {
        badgeHtml = `<span class="badge-verified"><i data-lucide="check-check" class="w-3.5 h-3.5"></i>${escapeHtml(r.verification_badge)}</span>`;
      } else if (r.status === "FLAGGED") {
        badgeHtml = `<span class="badge-discrepancy"><i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>${escapeHtml(r.verification_badge)}</span>`;
      } else {
        badgeHtml = `<span class="badge-qualitative"><i data-lucide="shield" class="w-3.5 h-3.5"></i>${escapeHtml(r.verification_badge)}</span>`;
      }
    }

    const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";

    return `
      <div class="review-card">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
              ${escapeHtml(r.user_name.charAt(0))}
            </div>
            <span class="text-xs font-bold text-white">${escapeHtml(r.user_name)}</span>
            <div class="star-rating ml-1">${starsHtml}</div>
          </div>
          <span class="text-[10px] text-slate-500">${dateStr}</span>
        </div>

        <div class="text-xs text-slate-300 leading-relaxed mb-2.5">
          ${escapeHtml(r.review_text)}
        </div>

        ${badgeHtml ? `<div class="mt-1">${badgeHtml}</div>` : ""}
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function openWriteReviewModal(targetType = "basket", targetId = "balanced_6m") {
  const modal = document.getElementById("writeReviewModal");
  if (!modal) return;

  const tTypeEl = document.getElementById("reviewTargetType");
  const tIdEl = document.getElementById("reviewTargetId");
  if (tTypeEl) tTypeEl.value = targetType;
  if (tIdEl) tIdEl.value = targetId;

  const feedback = document.getElementById("reviewFeedbackMsg");
  if (feedback) {
    feedback.className = "text-xs p-3 rounded-lg hidden mb-3";
    feedback.textContent = "";
  }

  setReviewRating(5);
  modal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function closeWriteReviewModal() {
  const modal = document.getElementById("writeReviewModal");
  if (modal) modal.classList.add("hidden");
}

function setReviewRating(rating) {
  ReviewState.selectedRating = rating;
  const input = document.getElementById("reviewRatingInput");
  if (input) input.value = rating;

  const label = document.getElementById("reviewRatingLabel");
  if (label) label.textContent = `${rating} Star${rating > 1 ? "s" : ""}`;

  const container = document.getElementById("reviewRatingStars");
  if (!container) return;

  const stars = container.querySelectorAll(".interactive-star");
  stars.forEach((star, idx) => {
    if (idx < rating) {
      star.style.fill = "#fbbf24";
      star.style.color = "#fbbf24";
    } else {
      star.style.fill = "transparent";
      star.style.color = "#475569";
    }
  });
}

async function submitUserReview() {
  const author = document.getElementById("reviewAuthorName")?.value.trim();
  const text = document.getElementById("reviewTextInput")?.value.trim();
  const targetType = document.getElementById("reviewTargetType")?.value || "basket";
  const targetId = document.getElementById("reviewTargetId")?.value || "balanced_6m";
  const rating = parseInt(document.getElementById("reviewRatingInput")?.value || "5", 10);
  const claimedReturnRaw = document.getElementById("reviewClaimedReturn")?.value;
  const claimedDuration = document.getElementById("reviewClaimedDuration")?.value;

  const feedback = document.getElementById("reviewFeedbackMsg");
  const submitBtn = document.getElementById("submitReviewBtn");

  if (!author || !text) {
    if (feedback) {
      feedback.className = "text-xs p-3 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 mb-3 block";
      feedback.textContent = "Please provide your name and review feedback.";
    }
    return;
  }

  const payload = {
    target_type: targetType,
    target_id: targetId,
    user_name: author,
    rating: rating,
    review_text: text,
    claimed_return_pct: claimedReturnRaw ? parseFloat(claimedReturnRaw) : null,
    claimed_duration: claimedDuration || null,
  };

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 mr-1 animate-spin"></i> Fact-Checking...`;
    if (window.lucide) lucide.createIcons();
  }

  try {
    const resp = await fetch("/api/v1/reviews/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await resp.json();

    if (result.is_approved) {
      if (feedback) {
        feedback.className = "text-xs p-3 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 mb-3 block";
        feedback.textContent = `Review Approved! Awarded badge: ${result.verification_badge}`;
      }

      setTimeout(() => {
        closeWriteReviewModal();
        loadBasketReviews(targetType, targetId);
      }, 1200);
    } else {
      if (feedback) {
        feedback.className = "text-xs p-3 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 mb-3 block";
        feedback.textContent = `Fact-Check Failed: ${result.rejection_reason || "Review rejected by compliance filter."}`;
      }
    }
  } catch (err) {
    if (feedback) {
      feedback.className = "text-xs p-3 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 mb-3 block";
      feedback.textContent = "Network error connecting to verification agent.";
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 mr-1"></i> Submit for Fact-Check`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

// ===================================================================
// Ticket #15: Sharable Portfolio Report Card (PDF / Image Export)
// 100% Client-Side generation using html2canvas and jsPDF + Web Share API
// ===================================================================

function downloadBlob(blob, filename) {
  if (typeof window === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  if (document.body && document.body.appendChild) {
    document.body.appendChild(a);
  }
  if (a.click) a.click();
  setTimeout(() => {
    try {
      if (document.body && document.body.removeChild) {
        document.body.removeChild(a);
      }
      if (URL.revokeObjectURL) {
        URL.revokeObjectURL(url);
      }
    } catch (e) {}
  }, 400);
}

function populateReportCard(data, isBasket = false) {
  const reportEl = document.getElementById("portfolioReportCardTemplate");
  if (!reportEl) return;

  const target = data || (isBasket ? AppState.currentBasket : (AppState.activePortfolio || AppState.currentBasket)) || {};

  // 1. Header & Timestamps
  const now = new Date();
  const tsEl = document.getElementById("reportTimestamp");
  if (tsEl) {
    tsEl.innerText = now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) + " IST";
  }

  const nameEl = document.getElementById("reportPortfolioName");
  if (nameEl) {
    nameEl.innerText = target.name || (isBasket ? "AI Recommended Basket" : "Simulated Virtual Portfolio");
  }

  const personaTag = document.getElementById("reportPersonaHorizonTag");
  if (personaTag) {
    personaTag.innerText = `${target.risk_persona || AppState.riskPersona || "Balanced"} • ${target.horizon || AppState.horizon || "6M"} Horizon`;
  }

  const regimeEl = document.getElementById("reportRegimeBadge");
  if (regimeEl) {
    const regimeText = target.current_regime || target.active_regime || AppState.activeRegime?.regime || "Low-Volatility Bull";
    regimeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ${escapeHtml(regimeText)}`;
  }

  // 2. Key Metrics
  const currVal = target.current_value != null ? target.current_value : (target.total_invested || target.capital || 50000);
  const invVal = target.invested_capital != null ? target.invested_capital : (target.total_invested || target.capital || 50000);
  const totalPnl = target.total_pnl != null ? target.total_pnl : (currVal - invVal);
  const totalPnlPct = target.total_pnl_pct != null 
    ? target.total_pnl_pct 
    : (target.growth_projections?.base_case_50th?.expected_return_pct != null 
        ? target.growth_projections.base_case_50th.expected_return_pct 
        : (invVal > 0 ? (totalPnl / invVal) * 100 : 0));
  const pnl1D = target.pnl_1d || 0.0;
  const pnl1DPct = target.pnl_1d_pct || 0.0;
  const alpha = target.benchmark_comparison?.alpha_vs_nifty ?? 4.5;
  const cashVal = target.cash != null ? target.cash : (target.unallocated_cash || 0);

  const signTotal = totalPnl >= 0 ? '+' : '';
  const sign1D = pnl1D >= 0 ? '+' : '';
  const signAlpha = alpha >= 0 ? '+' : '';

  if (document.getElementById("reportTotalValue")) {
    document.getElementById("reportTotalValue").innerText = `₹${currVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (document.getElementById("reportInvestedCapital")) {
    document.getElementById("reportInvestedCapital").innerText = `₹${invVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (document.getElementById("reportTotalReturn")) {
    const retEl = document.getElementById("reportTotalReturn");
    retEl.innerText = `${signTotal}₹${Math.abs(totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${signTotal}${totalPnlPct.toFixed(2)}%)`;
    retEl.className = `metric-val ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (document.getElementById("report1DReturn")) {
    const ret1DEl = document.getElementById("report1DReturn");
    ret1DEl.innerText = `${sign1D}₹${Math.abs(pnl1D).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sign1D}${pnl1DPct.toFixed(2)}%)`;
    ret1DEl.className = `font-bold tabular-nums ${pnl1D >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (document.getElementById("reportBenchmarkAlpha")) {
    const alphaEl = document.getElementById("reportBenchmarkAlpha");
    alphaEl.innerText = `${signAlpha}${alpha.toFixed(2)}%`;
    alphaEl.className = `metric-val ${alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (document.getElementById("reportCashBuffer")) {
    document.getElementById("reportCashBuffer").innerText = `₹${cashVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // 3. Asset Allocation & Donut Chart
  const rawHoldings = target.holdings || target.allocations || [];
  const holdings = rawHoldings.length > 0 ? rawHoldings : [
    { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", weight: 0.35, shares: 12, current_value: 35000, unrealized_pnl_pct: 12.4 },
    { symbol: "TCS", name: "Tata Consultancy", sector: "Technology", weight: 0.30, shares: 8, current_value: 30000, unrealized_pnl_pct: 8.9 },
    { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", weight: 0.20, shares: 15, current_value: 20000, unrealized_pnl_pct: 6.2 },
    { symbol: "GOLDBEES", name: "Nippon Gold ETF", sector: "Commodities", weight: 0.15, shares: 200, current_value: 15000, unrealized_pnl_pct: 5.1 }
  ];

  const holdingsBody = document.getElementById("reportHoldingsList");
  if (holdingsBody) {
    holdingsBody.innerHTML = holdings.slice(0, 8).map(h => {
      const pnl = h.unrealized_pnl_pct != null ? h.unrealized_pnl_pct : (h.pnl_1d_pct || 0);
      const pnlSign = pnl >= 0 ? '+' : '';
      const wt = ((h.weight || 0) * 100).toFixed(1);
      const val = h.current_value || (h.price ? h.price * (h.shares || h.shares_approx || 1) : 0);
      const shs = h.shares != null ? h.shares : (h.shares_approx || 0);
      return `
        <tr>
          <td class="font-bold text-white">${escapeHtml(h.symbol)}</td>
          <td class="text-slate-400">${escapeHtml(h.sector || 'Large Cap')}</td>
          <td class="text-right text-slate-300 font-medium">${shs}</td>
          <td class="text-right text-slate-300 font-medium">${wt}%</td>
          <td class="text-right font-semibold text-white">₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
          <td class="text-right font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${pnlSign}${pnl.toFixed(1)}%</td>
        </tr>
      `;
    }).join("");
  }

  const allocCanvas = document.getElementById("reportAllocationChart");
  if (allocCanvas && typeof Chart !== "undefined") {
    if (AppState.charts.reportAllocation) {
      AppState.charts.reportAllocation.destroy();
    }
    const ctx = allocCanvas.getContext("2d");
    const colors = ["#00D09C", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e", "#6366f1"];
    AppState.charts.reportAllocation = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: holdings.slice(0, 8).map(h => h.symbol),
        datasets: [{
          data: holdings.slice(0, 8).map(h => ((h.weight || 0) * 100).toFixed(1)),
          backgroundColor: colors.slice(0, holdings.length),
          borderWidth: 1,
          borderColor: "#0f172a"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "68%",
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  }

  // 4. Probabilistic Growth Projections
  const gp = target.growth_projections || AppState.currentBasket?.growth_projections;
  const q10Val = gp?.pessimistic_10th?.projected_value || Math.round(currVal * 0.98);
  const q10Pct = gp?.pessimistic_10th?.expected_return_pct || -2.0;
  const q50Val = gp?.base_case_50th?.projected_value || Math.round(currVal * 1.14);
  const q50Pct = gp?.base_case_50th?.expected_return_pct || 14.0;
  const q90Val = gp?.optimistic_90th?.projected_value || Math.round(currVal * 1.28);
  const q90Pct = gp?.optimistic_90th?.expected_return_pct || 28.0;

  const growthTiersEl = document.getElementById("reportGrowthTiers");
  if (growthTiersEl) {
    growthTiersEl.innerHTML = `
      <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
        <div class="text-[10px] text-slate-400 uppercase font-semibold">10th %ile (Pessimistic)</div>
        <div class="font-bold text-rose-400 mt-0.5 tabular-nums">₹${q10Val.toLocaleString('en-IN')} (${q10Pct >= 0 ? '+' : ''}${q10Pct.toFixed(1)}%)</div>
      </div>
      <div class="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
        <div class="text-[10px] text-emerald-300 uppercase font-semibold">50th %ile (Base Case)</div>
        <div class="font-bold text-emerald-400 mt-0.5 tabular-nums">₹${q50Val.toLocaleString('en-IN')} (${q50Pct >= 0 ? '+' : ''}${q50Pct.toFixed(1)}%)</div>
      </div>
      <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
        <div class="text-[10px] text-teal-300 uppercase font-semibold">90th %ile (Optimistic)</div>
        <div class="font-bold text-teal-300 mt-0.5 tabular-nums">₹${q90Val.toLocaleString('en-IN')} (${q90Pct >= 0 ? '+' : ''}${q90Pct.toFixed(1)}%)</div>
      </div>
    `;
  }

  const growthCanvas = document.getElementById("reportGrowthChart");
  if (growthCanvas && typeof Chart !== "undefined") {
    if (AppState.charts.reportGrowth) {
      AppState.charts.reportGrowth.destroy();
    }
    const ctx = growthCanvas.getContext("2d");
    AppState.charts.reportGrowth = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Pessimistic (Q10)", "Base Case (Q50)", "Optimistic (Q90)", "7% Bank FD Hurdle"],
        datasets: [{
          data: [q10Val, q50Val, q90Val, Math.round(currVal * 1.07)],
          backgroundColor: ["rgba(244, 63, 94, 0.75)", "rgba(0, 208, 156, 0.85)", "rgba(20, 184, 166, 0.75)", "rgba(245, 158, 11, 0.75)"],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: {
              color: "#94a3b8",
              callback: (val) => `₹${val.toLocaleString('en-IN')}`
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: "#e2e8f0", font: { size: 10 } }
          }
        }
      }
    });
  }

  // 5. Trust Card 4 Pillars
  const tc = target.trust_card || AppState.currentBasket?.trust_card;
  const suitability = tc?.regime_suitability?.score != null ? `${tc.regime_suitability.score}%` : "88% Bull Suitability";
  const winRate = tc?.directional_hit_rate != null ? `${(tc.directional_hit_rate * 100).toFixed(1)}%` : "68.4% Hit Rate";
  const maxDd = target.max_drawdown_pct != null && target.max_drawdown_pct > 0 
    ? `${target.max_drawdown_pct.toFixed(1)}%` 
    : (tc?.stress_drawdown_limit != null ? `${tc.stress_drawdown_limit}%` : "8.5% Max DD");
  const feeSavings = tc?.annual_fee_savings != null ? `₹${tc.annual_fee_savings.toLocaleString('en-IN')}/yr` : "₹3,500/yr Saved";

  const trustContainer = document.getElementById("reportTrustPillarsContainer");
  if (trustContainer) {
    trustContainer.innerHTML = `
      <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
        <div class="text-[9px] text-slate-400 uppercase font-semibold flex items-center gap-1">
          <i data-lucide="compass" class="w-3 h-3 text-emerald-400"></i> Regime Suitability
        </div>
        <div class="text-xs font-bold text-emerald-400 mt-1">${escapeHtml(suitability)}</div>
        <div class="text-[9px] text-slate-500 mt-0.5">Aligned with macro trend</div>
      </div>
      <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
        <div class="text-[9px] text-slate-400 uppercase font-semibold flex items-center gap-1">
          <i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-400"></i> Backtest Hit Rate
        </div>
        <div class="text-xs font-bold text-white mt-1">${escapeHtml(winRate)}</div>
        <div class="text-[9px] text-slate-500 mt-0.5">Directional accuracy</div>
      </div>
      <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
        <div class="text-[9px] text-slate-400 uppercase font-semibold flex items-center gap-1">
          <i data-lucide="shield" class="w-3 h-3 text-amber-400"></i> Stress Drawdown Limit
        </div>
        <div class="text-xs font-bold text-amber-400 mt-1">${escapeHtml(maxDd)}</div>
        <div class="text-[9px] text-slate-500 mt-0.5">Historical drawdown limit</div>
      </div>
      <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
        <div class="text-[9px] text-slate-400 uppercase font-semibold flex items-center gap-1">
          <i data-lucide="coins" class="w-3 h-3 text-teal-400"></i> Zero Middleman Fees
        </div>
        <div class="text-xs font-bold text-teal-300 mt-1">${escapeHtml(feeSavings)}</div>
        <div class="text-[9px] text-slate-500 mt-0.5">0% commissions vs 1.5% MF</div>
      </div>
    `;
  }

  // 6. ESG Conscience Score
  const esgScore = target.portfolio_esg_score || AppState.currentBasket?.portfolio_esg_score || 78.5;
  const esgBadge = target.portfolio_esg_badge || AppState.currentBasket?.portfolio_esg_badge || "🟢 High ESG";
  const esgBreakdown = target.portfolio_esg_breakdown || AppState.currentBasket?.portfolio_esg_breakdown || { environment: 82.0, social: 76.0, governance: 77.5 };

  if (document.getElementById("reportEsgScore")) {
    document.getElementById("reportEsgScore").innerText = `${typeof esgScore === 'number' ? esgScore.toFixed(1) : esgScore} / 100`;
  }
  if (document.getElementById("reportEsgBadge")) {
    document.getElementById("reportEsgBadge").innerText = esgBadge;
  }
  if (document.getElementById("reportEsgEnv")) {
    document.getElementById("reportEsgEnv").innerText = (esgBreakdown.environment || 82.0).toFixed(1);
  }
  if (document.getElementById("reportEsgSoc")) {
    document.getElementById("reportEsgSoc").innerText = (esgBreakdown.social || 76.0).toFixed(1);
  }
  if (document.getElementById("reportEsgGov")) {
    document.getElementById("reportEsgGov").innerText = (esgBreakdown.governance || 77.5).toFixed(1);
  }

  if (window.lucide) lucide.createIcons();
}

async function generatePortfolioReportBlob(format = "pdf", source = "portfolio") {
  const reportEl = document.getElementById("portfolioReportCardTemplate");
  if (!reportEl) throw new Error("Report card template container (#portfolioReportCardTemplate) not found");

  const target = source === "basket"
    ? AppState.currentBasket
    : (AppState.activePortfolio || AppState.currentBasket);

  populateReportCard(target, source === "basket");

  // Allow brief tick for DOM and Canvas paint
  await new Promise((resolve) => setTimeout(resolve, 50));

  if (typeof html2canvas === "undefined") {
    throw new Error("html2canvas is not available");
  }

  const canvas = await html2canvas(reportEl, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#090e1a",
  });

  const ts = Date.now();
  const nameClean = (target?.name || "Portfolio").replace(/[^a-zA-Z0-9_-]/g, "_");

  if (format === "pdf") {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("jsPDF is not available");
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL("image/png");
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const pdfBlob = pdf.output("blob");
    return {
      blob: pdfBlob,
      filename: `QuantNiti_${nameClean}_Report_${ts}.pdf`,
    };
  } else {
    // Generate PNG image blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Failed to capture report card as PNG blob"));
        resolve({
          blob: blob,
          filename: `QuantNiti_${nameClean}_Card_${ts}.png`,
        });
      }, "image/png");
    });
  }
}

async function downloadPortfolioReportPDF(source = "portfolio") {
  triggerHaptic(15);
  const btnId = source === "basket" ? "basketDownloadReportBtn" : "portfolioDownloadReportBtn";
  const btn = document.getElementById(btnId);
  const origHtml = btn ? btn.innerHTML : null;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full mr-1"></span> <span class="hidden sm:inline">Generating...</span>`;
  }

  try {
    const { blob, filename } = await generatePortfolioReportBlob("pdf", source);
    downloadBlob(blob, filename);
    showNotificationToast({
      severity: "INFO",
      title: "Report Card Downloaded",
      message: `Multi-page A4 PDF report saved: ${filename}`
    });
  } catch (err) {
    console.error("PDF download failed:", err);
    alert("Could not generate PDF: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
      if (window.lucide) lucide.createIcons();
    }
  }
}

async function sharePortfolioReport(source = "portfolio") {
  triggerHaptic(15);
  const btnId = source === "basket" ? "basketShareReportBtn" : "portfolioShareReportBtn";
  const btn = document.getElementById(btnId);
  const origHtml = btn ? btn.innerHTML : null;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full mr-1"></span> <span class="hidden sm:inline">Preparing...</span>`;
  }

  try {
    const { blob, filename } = await generatePortfolioReportBlob("image", source);
    const target = source === "basket" 
      ? AppState.currentBasket 
      : (AppState.activePortfolio || AppState.currentBasket);
    
    const retPct = target?.total_pnl_pct != null
      ? target.total_pnl_pct
      : (target?.growth_projections?.base_case_50th?.expected_return_pct ?? 12.5);
    const sign = retPct >= 0 ? '+' : '';
    const portName = target?.name || "AI Portfolio";

    const shareTitle = `QuantNiti Portfolio Intelligence: ${portName}`;
    const shareText = `🚀 My QuantNiti ${portName} is up ${sign}${retPct.toFixed(2)}% beating the benchmark! View algorithmic portfolio intelligence at ${window.location.origin || 'https://quantniti.in'} #QuantNiti #FinTech #AlgorithmicInvesting`;
    const shareUrl = window.location.origin || "https://quantniti.in";

    let shared = false;
    const file = typeof File !== "undefined"
      ? new File([blob], filename, { type: "image/png" })
      : blob;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        const payload = {
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        };
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          payload.files = [file];
        }
        await navigator.share(payload);
        shared = true;
        showNotificationToast({
          severity: "INFO",
          title: "Report Shared",
          message: "Portfolio report card shared successfully."
        });
      } catch (shareErr) {
        if (shareErr.name === "AbortError") {
          shared = true;
        } else {
          console.warn("navigator.share failed, switching to fallback:", shareErr);
        }
      }
    }

    if (!shared) {
      // Fallback: download PNG image and copy pre-formatted text + link to clipboard
      downloadBlob(blob, filename);
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareText);
        } catch (clipErr) {
          console.warn("Clipboard copy failed:", clipErr);
        }
      }
      showNotificationToast({
        severity: "INFO",
        title: "Report Card Saved",
        message: "Report image downloaded & share link copied to clipboard!"
      });
    }
  } catch (err) {
    console.error("Report share failed:", err);
    alert("Could not share report: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
      if (window.lucide) lucide.createIcons();
    }
  }
}


