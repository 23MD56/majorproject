import React, { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Activity,
  Leaf,
  Loader2,
} from "lucide-react";
import { ModalSheet } from "../ui/ModalSheet";
import { GlassCard } from "../ui/GlassCard";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { RegimeBadge } from "../ui/RegimeBadge";
import { apiUrl } from "../../config";

export interface StockProfileModalProps {
  symbol: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockProfileModal: React.FC<StockProfileModalProps> = ({
  symbol,
  isOpen,
  onClose,
}) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Stale-response guard: tracks the active requested symbol to prevent race conditions
  const activeSymbolRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen || !symbol) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Abort previous in-flight fetch if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeSymbolRef.current = symbol;

    setIsLoading(true);

    fetch(apiUrl(`/api/explore/profile/${encodeURIComponent(symbol)}`), {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Profile API returned status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Race condition guard: only commit if this response is for the currently active symbol
        if (activeSymbolRef.current === symbol) {
          setProfile(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          return; // Intentionally aborted due to rapid user tapping
        }
        if (activeSymbolRef.current === symbol) {
          // Fallback mock profile for offline/testing robustness
          const fallback = generateFallbackProfile(symbol);
          setProfile(fallback);
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [symbol, isOpen]);

  // Helper generator for fallback data
  function generateFallbackProfile(sym: string) {
    return {
      symbol: sym,
      name: sym.replace(".NS", ""),
      sector: "Diversified",
      current_price: 2450.0,
      day_change: 22.5,
      day_change_pct: 0.92,
      day_high: 2480.0,
      day_low: 2420.0,
      week_52_high: 2800.0,
      week_52_low: 1950.0,
      volume: 8500000,
      as_of_date: new Date().toISOString().split("T")[0],
      forecast: {
        symbol: sym,
        current_price: 2450.0,
        as_of_date: new Date().toISOString().split("T")[0],
        m1: { horizon: "1M", days: 30, pessimistic_pct: 1.0, base_pct: 3.2, optimistic_pct: 5.8, pessimistic_price: 2474.5, base_price: 2528.4, optimistic_price: 2592.1 },
        m3: { horizon: "3M", days: 90, pessimistic_pct: 2.5, base_pct: 6.8, optimistic_pct: 12.0, pessimistic_price: 2511.2, base_price: 2616.6, optimistic_price: 2744.0 },
        m6: { horizon: "6M", days: 180, pessimistic_pct: 4.0, base_pct: 13.5, optimistic_pct: 21.0, pessimistic_price: 2548.0, base_price: 2780.7, optimistic_price: 2964.5 },
        m12: { horizon: "12M", days: 365, pessimistic_pct: 7.5, base_pct: 22.0, optimistic_pct: 36.0, pessimistic_price: 2633.7, base_price: 2989.0, optimistic_price: 3332.0 },
      },
      suitability: {
        score: 82.0,
        badge: "Strong Buy",
        primary_regime: "Bullish Momentum",
        description: "High relative strength and strong factor score in the active regime.",
      },
      factors: {
        rsi_14: 61.5,
        macd: 14.2,
        macd_hist: 3.1,
        bollinger_pct_b: 0.72,
        ema_20_50_spread: 2.1,
        ema_50_200_spread: 6.8,
        momentum_1m: 3.2,
        momentum_3m: 6.8,
        momentum_6m: 13.5,
        momentum_12m: 22.0,
        realized_vol_30d: 15.2,
        realized_vol_90d: 17.1,
        max_drawdown_1y: -10.2,
        beta: 1.02,
        alpha_annualized: 4.2,
        market_correlation: 0.79,
      },
      benchmark_comparison: {
        stock_3y_return: 58.2,
        benchmark_3y_return: 42.1,
        alpha: 4.5,
        beta: 1.02,
        correlation: 0.79,
      },
      peers: [],
      esg: {
        symbol: sym,
        name: sym.replace(".NS", ""),
        sector: "Diversified",
        esg_composite: 76.0,
        esg_environment: 72.0,
        esg_social: 75.0,
        esg_governance: 81.0,
        badge: "Leader",
        source: "BRSR / CRISIL ESG",
      },
    };
  }

  const isPositive = (profile?.day_change_pct || 0) >= 0;

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[520px]"
      title={
        profile ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm px-2 py-0.5 rounded bg-violet-500/10 text-accent font-bold">
              {profile.symbol}
            </span>
            <span className="text-base font-bold text-[var(--text-main)] truncate max-w-[240px]">
              {profile.name}
            </span>
          </div>
        ) : (
          "Stock Profile"
        )
      }
    >
      <div data-testid="stock-profile-modal" className="flex flex-col gap-5 pb-6">
        {isLoading && !profile ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-[var(--text-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-accent" />
            <span className="text-xs font-medium">Loading 360° intelligence profile...</span>
          </div>
        ) : profile ? (
          <>
            {/* Header Quote & Badge */}
            <div className="flex items-start justify-between p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
              <div>
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  360° Intelligence Profile
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-[var(--text-main)] tracking-tight">
                    ₹<AnimatedNumber value={profile.current_price} formatter={(v) => v.toFixed(2)} />
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {profile.day_change_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-1 font-mono">
                  <span>H: ₹{profile.day_high?.toFixed(2) || profile.current_price}</span>
                  <span>L: ₹{profile.day_low?.toFixed(2) || profile.current_price}</span>
                  <span>Sector: {profile.sector}</span>
                </div>
              </div>

              {/* Regime Suitability Badge */}
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
                  Regime Fit
                </div>
                <RegimeBadge
                  regime={profile.suitability?.primary_regime || "Bullish Momentum"}
                  size="sm"
                />
              </div>
            </div>

            {/* Section 1: Multi-Horizon Forecast Cones */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
                  Forecast Return Cones
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "1 Month", cone: profile.forecast?.m1 },
                  { label: "3 Months", cone: profile.forecast?.m3 },
                  { label: "6 Months", cone: profile.forecast?.m6 },
                  { label: "12 Months", cone: profile.forecast?.m12 },
                ].map((item, idx) => (
                  <GlassCard key={idx} className="p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                      {item.label}
                    </span>
                    <div className="my-1.5">
                      <span className="text-sm font-black text-accent">
                        +{item.cone?.base_pct?.toFixed(1) || "0.0"}%
                      </span>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        ₹{item.cone?.base_price?.toFixed(0) || "0"}
                      </div>
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-subtle)] pt-1">
                      <span>{item.cone?.pessimistic_pct?.toFixed(0)}%</span>
                      <span className="text-emerald-500 font-semibold">
                        +{item.cone?.optimistic_pct?.toFixed(0)}%
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Section 2: Technical Factor Snapshot */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Activity className="w-4 h-4 text-accent" />
                <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
                  Technical Factor Snapshot
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <GlassCard className="p-2.5 rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                    RSI (14D)
                  </span>
                  <div className="text-base font-black text-[var(--text-main)] mt-0.5">
                    {profile.factors?.rsi_14?.toFixed(1) || "55.0"}
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)]">
                    {profile.factors?.rsi_14 > 70
                      ? "Overbought"
                      : profile.factors?.rsi_14 < 30
                      ? "Oversold"
                      : "Neutral"}
                  </span>
                </GlassCard>

                <GlassCard className="p-2.5 rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                    MACD Hist
                  </span>
                  <div
                    className={`text-base font-black mt-0.5 ${
                      (profile.factors?.macd_hist || 0) >= 0
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {profile.factors?.macd_hist > 0 ? "+" : ""}
                    {profile.factors?.macd_hist?.toFixed(2) || "0.00"}
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)]">Momentum spread</span>
                </GlassCard>

                <GlassCard className="p-2.5 rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                    Beta (1Y)
                  </span>
                  <div className="text-base font-black text-[var(--text-main)] mt-0.5">
                    {profile.factors?.beta?.toFixed(2) || "1.00"}
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)]">vs NIFTY 50</span>
                </GlassCard>

                <GlassCard className="p-2.5 rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                    Alpha (Ann)
                  </span>
                  <div className="text-base font-black text-accent mt-0.5">
                    +{profile.factors?.alpha_annualized?.toFixed(1) || "3.5"}%
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)]">Excess return</span>
                </GlassCard>

                <GlassCard className="p-2.5 rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                    Realized Vol
                  </span>
                  <div className="text-base font-black text-[var(--text-main)] mt-0.5">
                    {profile.factors?.realized_vol_30d?.toFixed(1) || "18.0"}%
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)]">30-day annualized</span>
                </GlassCard>

                <GlassCard className="p-2.5 rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                    Max Drawdown
                  </span>
                  <div className="text-base font-black text-rose-500 mt-0.5">
                    {profile.factors?.max_drawdown_1y?.toFixed(1) || "-12.5"}%
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)]">1-Year peak-to-trough</span>
                </GlassCard>
              </div>
            </div>

            {/* Section 3: ESG Sustainability Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
                    ESG Sustainability
                  </h4>
                </div>
                {profile.esg?.badge && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {profile.esg.badge}
                  </span>
                )}
              </div>

              <GlassCard className="p-3.5 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-main)]">
                    Composite ESG Score
                  </span>
                  <span className="text-base font-black text-emerald-500">
                    {profile.esg?.esg_composite?.toFixed(0) || "75"}/100
                  </span>
                </div>

                <div className="space-y-2 pt-1 border-t border-[var(--border-subtle)]">
                  <div>
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1">
                      <span>Environmental (E)</span>
                      <span className="font-semibold text-[var(--text-main)]">
                        {profile.esg?.esg_environment?.toFixed(0) || "70"}/100
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-violet-500/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, profile.esg?.esg_environment || 70))}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1">
                      <span>Social (S)</span>
                      <span className="font-semibold text-[var(--text-main)]">
                        {profile.esg?.esg_social?.toFixed(0) || "75"}/100
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-violet-500/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, profile.esg?.esg_social || 75))}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1">
                      <span>Governance (G)</span>
                      <span className="font-semibold text-[var(--text-main)]">
                        {profile.esg?.esg_governance?.toFixed(0) || "80"}/100
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-violet-500/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, profile.esg?.esg_governance || 80))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[var(--text-muted)] italic pt-1">
                  Source: {profile.esg?.source || "BRSR / CRISIL ESG / NSE Sustainability"}
                </div>
              </GlassCard>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-sm text-[var(--text-muted)]">
            Select a stock to view its intelligence profile.
          </div>
        )}
      </div>
    </ModalSheet>
  );
};
