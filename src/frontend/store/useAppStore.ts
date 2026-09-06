import { create } from "zustand";

export type NavTab = "home" | "explore" | "grow" | "portfolio";
export type TimeHorizon = "1M" | "3M" | "6M" | "12M";
export type RiskPersona = "Conservative" | "Balanced" | "Aggressive" | "ESG-Conscious";

export interface AppStoreState {
  activeTab: NavTab;
  theme: "light" | "dark";
  capital: number;
  horizon: TimeHorizon;
  riskPersona: RiskPersona;
  activeRegime: any;
  currentBasket: any;
  activePortfolioId: string | null;
  activePortfolio: any;
  portfolios: any[];
  allExploreStocks: any[];
  selectedStockSymbol: string | null;
  activeBacktest: any;
  nitibotSessionId: string;
  charts: Record<string, any>;
  literacyCards: any[];
  learnedConcepts: Set<string>;
  selectedLiteracyCategory: string;
  activeConceptKey: string | null;
  activeAsyncKeys: Set<string>;
  isOnboarded: boolean;

  // Actions
  setActiveTab: (tab: NavTab) => void;
  setTheme: (theme: "light" | "dark") => void;
  setCapital: (capital: number) => void;
  setHorizon: (horizon: TimeHorizon) => void;
  setRiskPersona: (persona: RiskPersona) => void;
  setIsOnboarded: (onboarded: boolean) => void;
  setActiveRegime: (regime: any) => void;
  setCurrentBasket: (basket: any) => void;
  setActivePortfolioId: (id: string | null) => void;
  setActivePortfolio: (portfolio: any) => void;
  setPortfolios: (portfolios: any[]) => void;
  setAllExploreStocks: (stocks: any[]) => void;
  setSelectedStockSymbol: (symbol: string | null) => void;
  setActiveBacktest: (backtest: any) => void;
  setLiteracyCards: (cards: any[]) => void;
  setSelectedLiteracyCategory: (category: string) => void;
  setActiveConceptKey: (key: string | null) => void;
  toggleLearnedConcept: (conceptKey: string) => void;
  addActiveAsyncKey: (key: string) => void;
  removeActiveAsyncKey: (key: string) => void;
  clearActiveAsyncKeys: () => void;
}

const LEARNED_CONCEPTS_STORAGE_KEY = "quantniti_learned_concepts";
export const ONBOARDED_STORAGE_KEY = "quantniti_onboarded";
export const RISK_PERSONA_STORAGE_KEY = "quantniti_risk_persona";

function loadLearnedConcepts(): Set<string> {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(LEARNED_CONCEPTS_STORAGE_KEY);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  }
  return new Set();
}

function loadIsOnboarded(): boolean {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem(ONBOARDED_STORAGE_KEY) === "true";
  }
  return false;
}

function loadRiskPersona(): RiskPersona {
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = window.localStorage.getItem(RISK_PERSONA_STORAGE_KEY);
    if (
      saved === "Conservative" ||
      saved === "Balanced" ||
      saved === "Aggressive" ||
      saved === "ESG-Conscious"
    ) {
      return saved as RiskPersona;
    }
  }
  return "Balanced";
}

export const useAppStore = create<AppStoreState>((set) => ({
  activeTab: "home",
  theme: "light",
  capital: 50000,
  horizon: "6M",
  riskPersona: loadRiskPersona(),
  isOnboarded: loadIsOnboarded(),
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
  learnedConcepts: loadLearnedConcepts(),
  selectedLiteracyCategory: "all",
  activeConceptKey: null,
  activeAsyncKeys: new Set(),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => set({ theme }),
  setCapital: (capital) => set({ capital }),
  setHorizon: (horizon) => set({ horizon }),
  setRiskPersona: (riskPersona) => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(RISK_PERSONA_STORAGE_KEY, riskPersona);
    }
    set({ riskPersona });
  },
  setIsOnboarded: (isOnboarded) => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(ONBOARDED_STORAGE_KEY, String(isOnboarded));
    }
    set({ isOnboarded });
  },
  setActiveRegime: (activeRegime) => set({ activeRegime }),
  setCurrentBasket: (currentBasket) => set({ currentBasket }),
  setActivePortfolioId: (activePortfolioId) => set({ activePortfolioId }),
  setActivePortfolio: (activePortfolio) => set({ activePortfolio }),
  setPortfolios: (portfolios) => set({ portfolios }),
  setAllExploreStocks: (allExploreStocks) => set({ allExploreStocks }),
  setSelectedStockSymbol: (selectedStockSymbol) => set({ selectedStockSymbol }),
  setActiveBacktest: (activeBacktest) => set({ activeBacktest }),
  setLiteracyCards: (literacyCards) => set({ literacyCards }),
  setSelectedLiteracyCategory: (selectedLiteracyCategory) => set({ selectedLiteracyCategory }),
  setActiveConceptKey: (activeConceptKey) => set({ activeConceptKey }),

  addActiveAsyncKey: (key: string) => {
    set((state) => {
      const next = new Set(state.activeAsyncKeys);
      next.add(key);
      return { activeAsyncKeys: next };
    });
  },

  removeActiveAsyncKey: (key: string) => {
    set((state) => {
      const next = new Set(state.activeAsyncKeys);
      next.delete(key);
      return { activeAsyncKeys: next };
    });
  },

  clearActiveAsyncKeys: () => {
    set({ activeAsyncKeys: new Set() });
  },

  toggleLearnedConcept: (conceptKey: string) => {
    set((state) => {
      const next = new Set(state.learnedConcepts);
      if (next.has(conceptKey)) {
        next.delete(conceptKey);
      } else {
        next.add(conceptKey);
      }
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          LEARNED_CONCEPTS_STORAGE_KEY,
          JSON.stringify(Array.from(next))
        );
      }
      return { learnedConcepts: next };
    });
  },
}));
