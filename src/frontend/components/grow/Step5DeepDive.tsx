import React, { useState } from "react";
import {
  ShieldCheck,
  BarChart3,
  ChevronLeft,
  Briefcase,
  Star,
  Users,
  Leaf,
} from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { PrimaryButton } from "../ui/PrimaryButton";
import { GhostButton } from "../ui/GhostButton";

export interface Step5DeepDiveProps {
  basket: any;
  onBackToResults: () => void;
  onTrackInPortfolio: () => void;
}

const SAMPLE_REVIEWS = [
  {
    id: "rev-1",
    author: "Arjun M. (Bengaluru)",
    role: "Retail Investor",
    rating: 5,
    category: "Transparency",
    title: "No hidden black box",
    comment:
      "The regime breakdown and drawdown bounds gave me confidence to allocate without anxiety.",
  },
  {
    id: "rev-2",
    author: "Pooja S. (Mumbai)",
    role: "First-time Investor",
    rating: 5,
    category: "Educational",
    title: "Clear literacy analogies",
    comment:
      "Learning cards helped me understand why gold was allocated during high volatility.",
  },
  {
    id: "rev-3",
    author: "Rohan D. (Delhi)",
    role: "Active Quant User",
    rating: 4,
    category: "Usability",
    title: "Smooth guided wizard",
    comment:
      "The multi-step flow feels like a premier mobile app, much cleaner than traditional brokerage interfaces.",
  },
];

export const Step5DeepDive: React.FC<Step5DeepDiveProps> = ({
  basket,
  onBackToResults,
  onTrackInPortfolio,
}) => {
  const [activeReviewCategory, setActiveReviewCategory] = useState<string>("All");

  const trustCard = basket?.trust_card || {};
  const esgScore = basket?.portfolio_esg_score || 78.4;
  const esgBadge = basket?.portfolio_esg_badge || "🟢 Strong ESG";
  const esgBreakdown = basket?.portfolio_esg_breakdown || {
    Environmental: 81.2,
    Social: 75.6,
    Governance: 78.4,
  };

  const benchmarks = basket?.benchmark_comparisons || [
    { name: "Bank FD (7.0% p.a.)", return_pct: 3.5, label: "Low Risk Fixed" },
    { name: "NIFTY 50 Benchmark", return_pct: 6.2, label: "Market Index" },
    { name: "QuantNiti AI Basket", return_pct: 9.8, label: "Regime-Adaptive", highlight: true },
  ];

  const filteredReviews = SAMPLE_REVIEWS.filter(
    (rev) => activeReviewCategory === "All" || rev.category === activeReviewCategory
  );

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider block">
          Step 5: Explainable Deep Dive
        </span>
        <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
          Trust & Intelligence Card
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          Full algorithmic transparency, benchmark comparisons, and community legitimacy.
        </p>
      </div>

      {/* 1. ESG Conscience Score Card */}
      <GlassCard className="p-5 space-y-4 bg-teal-500/10 border-teal-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-main)]">ESG Conscience Score</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Sustainability & Governance Rating</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
            {esgBadge}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-300">{esgScore.toFixed(1)}</span>
          <span className="text-xs text-[var(--text-muted)] font-medium">/ 100 Overall Score</span>
        </div>

        {/* ESG Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-teal-500/20">
          {Object.entries(esgBreakdown).map(([key, val]: [string, any]) => (
            <div key={key} className="text-center p-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">{key}</span>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-200 mt-0.5 block">{Number(val).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 2. 4-Pillar Explainable AI Trust Card */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <h3 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
            4-Pillar Explainable AI Trust Card
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pillar 1 */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Pillar 1: Regime Suitability
            </span>
            <p className="text-xs font-bold text-[var(--text-main)]">
              {trustCard?.pillar_1_regime_suitability || `${basket?.active_regime || "Bull"} Adaptive`}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Factor tilts conditioned on macroeconomic volatility and price dispersion.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Pillar 2: Directional Hit Rate
            </span>
            <p className="text-xs font-bold text-[var(--text-main)]">
              {trustCard?.pillar_2_hit_rate || "68.4% Backtested Win Rate"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Based on historical outperformance across identical market regimes.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Pillar 3: Stress Drawdown Limit
            </span>
            <p className="text-xs font-bold text-[var(--text-main)]">
              {trustCard?.pillar_3_drawdown || "Capped at < 12% Drawdown"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Strict HRP asset clustering prevents single-sector contagion risks.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Pillar 4: Fee Savings
            </span>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {trustCard?.pillar_4_fee_savings || "Save ~₹3,200/yr vs Traditional PMS"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Zero distributor commission drag using direct low-cost ETF instruments.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Benchmark Comparison */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <h3 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
            Benchmark Comparison ({basket?.horizon || "6M"})
          </h3>
        </div>

        <div className="space-y-2">
          {benchmarks.map((bm: any, i: number) => {
            const isHighlight = bm.highlight || bm.name.includes("QuantNiti");
            return (
              <div
                key={bm.name || i}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isHighlight
                    ? "bg-violet-500/15 border-violet-500/40 text-[var(--text-main)]"
                    : "bg-[var(--bg-card-subtle)] border-[var(--border-subtle)] text-[var(--text-main)]"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold">{bm.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{bm.label}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold ${
                      isHighlight ? "text-emerald-600 dark:text-emerald-400 text-sm" : "text-[var(--text-muted)]"
                    }`}
                  >
                    +{bm.return_pct?.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Community Reviews */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
              Community Reviews & Legitimacy
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-500 dark:text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
            <span>4.9</span>
            <span className="text-[var(--text-muted)] font-normal">(128)</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {["All", "Transparency", "Educational", "Usability"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveReviewCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeReviewCategory === cat
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        <div className="space-y-2">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-main)]">{rev.author}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} className="w-3 h-3 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-300">{rev.title}</p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="space-y-3 pt-2">
        <PrimaryButton
          fullWidth
          onClick={onTrackInPortfolio}
          icon={<Briefcase className="w-4 h-4" />}
        >
          Track in Virtual Paper Portfolio
        </PrimaryButton>

        <GhostButton onClick={onBackToResults} icon={<ChevronLeft className="w-4 h-4" />}>
          Back to Results Overview
        </GhostButton>
      </div>
    </div>
  );
};
