import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../../../src/frontend/store/useAppStore";

describe("useAppStore Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      activeTab: "home",
      theme: "light",
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
      nitibotSessionId: "session_test",
      charts: {},
      literacyCards: [],
      learnedConcepts: new Set<string>(),
      selectedLiteracyCategory: "all",
      activeConceptKey: null,
      isOnboarded: false,
    });
  });

  it("initializes with AppState-matching defaults", () => {
    const state = useAppStore.getState();
    expect(state.activeTab).toBe("home");
    expect(state.theme).toBe("light");
    expect(state.capital).toBe(50000);
    expect(state.horizon).toBe("6M");
    expect(state.isOnboarded).toBe(false);
    expect(state.riskPersona).toBe("Balanced");
    expect(state.activeRegime).toBeNull();
    expect(state.currentBasket).toBeNull();
    expect(state.activePortfolioId).toBeNull();
    expect(state.activePortfolio).toBeNull();
    expect(state.portfolios).toEqual([]);
    expect(state.allExploreStocks).toEqual([]);
    expect(state.selectedStockSymbol).toBeNull();
    expect(state.activeBacktest).toBeNull();
    expect(state.nitibotSessionId).toMatch(/^session_/);
    expect(state.charts).toEqual({});
    expect(state.literacyCards).toEqual([]);
    expect(state.learnedConcepts).toBeInstanceOf(Set);
    expect(state.selectedLiteracyCategory).toBe("all");
    expect(state.activeConceptKey).toBeNull();
  });

  it("updates activeTab, capital, horizon, riskPersona, and selectedStockSymbol via action setters", () => {
    const {
      setActiveTab,
      setCapital,
      setHorizon,
      setRiskPersona,
      setSelectedStockSymbol,
    } = useAppStore.getState();

    setActiveTab("grow");
    expect(useAppStore.getState().activeTab).toBe("grow");

    setCapital(75000);
    expect(useAppStore.getState().capital).toBe(75000);

    setHorizon("12M");
    expect(useAppStore.getState().horizon).toBe("12M");

    setRiskPersona("Aggressive");
    expect(useAppStore.getState().riskPersona).toBe("Aggressive");

    setSelectedStockSymbol("RELIANCE");
    expect(useAppStore.getState().selectedStockSymbol).toBe("RELIANCE");
  });

  it("toggles learnedConcepts and syncs with localStorage", () => {
    const { toggleLearnedConcept } = useAppStore.getState();

    toggleLearnedConcept("hrp_diversification");
    let state = useAppStore.getState();
    expect(state.learnedConcepts.has("hrp_diversification")).toBe(true);

    let stored = JSON.parse(localStorage.getItem("quantniti_learned_concepts") || "[]");
    expect(stored).toContain("hrp_diversification");

    // Toggle off
    toggleLearnedConcept("hrp_diversification");
    state = useAppStore.getState();
    expect(state.learnedConcepts.has("hrp_diversification")).toBe(false);

    stored = JSON.parse(localStorage.getItem("quantniti_learned_concepts") || "[]");
    expect(stored).not.toContain("hrp_diversification");
  });

  it("manages isOnboarded state and synchronizes with localStorage", () => {
    const { setIsOnboarded, setRiskPersona } = useAppStore.getState();

    expect(useAppStore.getState().isOnboarded).toBe(false);

    setIsOnboarded(true);
    expect(useAppStore.getState().isOnboarded).toBe(true);
    expect(localStorage.getItem("quantniti_onboarded")).toBe("true");

    setRiskPersona("Conservative");
    expect(useAppStore.getState().riskPersona).toBe("Conservative");
    expect(localStorage.getItem("quantniti_risk_persona")).toBe("Conservative");

    setIsOnboarded(false);
    expect(useAppStore.getState().isOnboarded).toBe(false);
    expect(localStorage.getItem("quantniti_onboarded")).toBe("false");
  });
});
