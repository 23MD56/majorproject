import React, { useEffect, useState } from "react";
import { BookOpen, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { GlassCard, ChipButton, ModalSheet, PrimaryButton } from "../ui";
import { useAppStore } from "../../store/useAppStore";
import { useAbortableRequest } from "../../hooks/useAbortableRequest";

export interface LearningHubProps {
  className?: string;
}

export const LearningHub: React.FC<LearningHubProps> = ({ className = "" }) => {
  const {
    literacyCards,
    setLiteracyCards,
    learnedConcepts,
    toggleLearnedConcept,
    selectedLiteracyCategory,
    setSelectedLiteracyCategory,
  } = useAppStore();

  const [activeConcept, setActiveConcept] = useState<any | null>(null);
  const { request } = useAbortableRequest();

  useEffect(() => {
    if (!literacyCards || literacyCards.length === 0) {
      const fetchCards = async () => {
        try {
          const data = await request<any>("literacy-cards", "/api/v1/literacy/all");
          if (data && Array.isArray(data.cards)) {
            setLiteracyCards(data.cards);
          }
        } catch {
          // Default initial concept cards
          setLiteracyCards([
            {
              key: "regime-investing",
              title: "Market Regimes 101",
              summary: "How market environments dictate whether momentum or mean-reversion wins.",
              detail: "Market regimes identify shifts in macro volatility, liquidity, and trend persistence. By sizing exposure according to the regime (Bull, Sideways, Bear), you prevent deep drawdowns and capture alpha during expansions.",
              category: "Strategy",
              read_time_min: 3,
            },
            {
              key: "sharpe-ratio",
              title: "Understanding Sharpe",
              summary: "Learn how excess return per unit of volatility reveals true strategy quality.",
              detail: "The Sharpe Ratio measures the performance of an investment compared to a risk-free asset, after adjusting for its risk. A Sharpe ratio greater than 1.0 is considered good, while over 2.0 is exceptional.",
              category: "Metrics",
              read_time_min: 2,
            },
            {
              key: "esg-scoring",
              title: "ESG Conscience Scoring",
              summary: "Investing aligned with sustainability, corporate governance, and ethics.",
              detail: "Environmental, Social, and Governance (ESG) criteria allow investors to screen for sustainable companies that exhibit resilient long-term governance and minimal regulatory risk.",
              category: "ESG",
              read_time_min: 4,
            },
            {
              key: "drawdown-control",
              title: "Managing Max Drawdown",
              summary: "Why avoiding a -50% loss is far more important than chasing a +50% gain.",
              detail: "If an asset drops 50%, you need a 100% gain just to break even. QuantNiti uses dynamic cash buffers and stop-allocation constraints to protect capital first.",
              category: "Psychology",
              read_time_min: 3,
            },
          ]);
        }
      };
      fetchCards();
    }
  }, [literacyCards, setLiteracyCards, request]);

  const categories = ["all", "Strategy", "Metrics", "Psychology", "ESG"];

  const filteredCards = (literacyCards || []).filter((card) => {
    if (selectedLiteracyCategory === "all") return true;
    return card.category?.toLowerCase() === selectedLiteracyCategory.toLowerCase();
  });

  const totalCards = literacyCards?.length || 10;
  const completedCount = learnedConcepts?.size || 0;
  const progressPct = Math.min(100, Math.round((completedCount / (totalCards || 1)) * 100));

  return (
    <GlassCard className={`p-5 flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-[var(--text-main)]">
              Financial Learning Hub
            </h3>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              Concept Mastery & Microlearning
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold font-mono text-accent">
            {completedCount}/{totalCards}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] ml-1">Learned</span>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="flex flex-col gap-1">
        <div className="h-1.5 w-full rounded-full bg-violet-400/20 dark:bg-violet-500/15 overflow-hidden">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
          />
        </div>
        <span className="text-[10px] text-[var(--text-muted)] text-right font-medium">
          {progressPct}% Concept Mastery
        </span>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <ChipButton
            key={cat}
            selected={selectedLiteracyCategory === cat}
            onClick={() => setSelectedLiteracyCategory(cat)}
            className="capitalize whitespace-nowrap"
          >
            {cat}
          </ChipButton>
        ))}
      </div>

      {/* Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar snap-x">
        {filteredCards.map((card) => {
          const isLearned = learnedConcepts?.has(card.key);

          return (
            <div
              key={card.key}
              onClick={() => setActiveConcept(card)}
              className="snap-start shrink-0 w-[220px] p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:border-violet-500/30 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-150"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                    {card.category || "Concept"}
                  </span>
                  {isLearned && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>

                <h4 className="text-xs font-bold text-[var(--text-main)] line-clamp-1">
                  {card.title}
                </h4>

                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                  {card.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{card.read_time_min || 3} min</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-accent" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Concept Detail ModalSheet */}
      <ModalSheet
        isOpen={Boolean(activeConcept)}
        onClose={() => setActiveConcept(null)}
        title={activeConcept?.title || "Concept Details"}
      >
        {activeConcept && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-accent/10 text-accent">
                {activeConcept.category || "Education"}
              </span>
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activeConcept.read_time_min || 3} min read
              </span>
            </div>

            <p className="text-sm text-[var(--text-main)] leading-relaxed">
              {activeConcept.detail || activeConcept.summary}
            </p>

            <div className="pt-2">
              <PrimaryButton
                fullWidth
                onClick={() => {
                  toggleLearnedConcept(activeConcept.key);
                  setActiveConcept(null);
                }}
              >
                {learnedConcepts.has(activeConcept.key)
                  ? "Mark as Incomplete"
                  : "Mark as Learned ✓"}
              </PrimaryButton>
            </div>
          </div>
        )}
      </ModalSheet>
    </GlassCard>
  );
};
