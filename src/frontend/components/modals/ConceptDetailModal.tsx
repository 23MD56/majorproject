import React from "react";
import { BookOpen, CheckCircle, Award, Sparkles, Brain } from "lucide-react";
import { ModalSheet } from "../ui/ModalSheet";
import { PrimaryButton } from "../ui/PrimaryButton";
import { useAppStore } from "../../store/useAppStore";

export interface ConceptDetailData {
  key: string;
  title: string;
  category: string;
  explanation: string;
  analogy: string;
  formula?: string;
  related_keys?: string[];
}

interface ConceptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  concept?: ConceptDetailData | null;
}

export const ConceptDetailModal: React.FC<ConceptDetailModalProps> = ({
  isOpen,
  onClose,
  concept,
}) => {
  const { learnedConcepts, toggleLearnedConcept } = useAppStore();

  if (!concept) return null;

  const isLearned = learnedConcepts.has(concept.key);

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--text-main)] text-base">{concept.title}</h3>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-accent dark:text-violet-300 border border-violet-500/30 font-bold">
                {concept.category}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">Financial Literacy Bite</p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Core Explanation */}
        <div className="space-y-1.5 p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
          <span className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            Plain-English Definition
          </span>
          <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed font-normal">
            {concept.explanation}
          </p>
        </div>

        {/* Real-World Analogy */}
        <div className="space-y-1.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Everyday Analogy
          </span>
          <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100/90 leading-relaxed">
            {concept.analogy}
          </p>
        </div>

        {/* Formula / Quant Rule */}
        {concept.formula && (
          <div className="space-y-1.5 p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] font-mono">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block font-sans">
              Mathematical / Algorithmic Formulation
            </span>
            <div className="p-2.5 rounded-xl bg-slate-200/70 dark:bg-slate-900 text-xs text-violet-700 dark:text-violet-300 overflow-x-auto border border-[var(--border-subtle)]">
              <code>{concept.formula}</code>
            </div>
          </div>
        )}

        {/* Mark as Learned Toggle */}
        <div className="pt-2">
          <PrimaryButton
            fullWidth
            onClick={() => toggleLearnedConcept(concept.key)}
            icon={
              isLearned ? (
                <CheckCircle className="w-4 h-4 text-emerald-300" />
              ) : (
                <Award className="w-4 h-4" />
              )
            }
            className={
              isLearned
                ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                : "bg-violet-600 hover:bg-violet-500 text-white"
            }
          >
            {isLearned ? "Marked as Learned ✓" : "Mark as Learned (+25 XP)"}
          </PrimaryButton>
        </div>
      </div>
    </ModalSheet>
  );
};
