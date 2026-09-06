import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Sliders,
  Target,
} from "lucide-react";
import { ProgressBar } from "../ui/ProgressBar";
import { PrimaryButton } from "../ui/PrimaryButton";
import { GhostButton } from "../ui/GhostButton";
import { GlassCard } from "../ui/GlassCard";
import { QUIZ_QUESTIONS, calculatePersonaResult } from "./personaScoring";
import { QuizAnswers, PersonaResult } from "./types";
import { useAppStore } from "../../store/useAppStore";

export interface OnboardingHeroProps {
  onComplete?: (result: PersonaResult) => void;
}

export const OnboardingHero: React.FC<OnboardingHeroProps> = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
  const { setRiskPersona, setHorizon, setIsOnboarded } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const currentQuestion = QUIZ_QUESTIONS[questionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNextQuestion = () => {
    if (questionIndex < QUIZ_QUESTIONS.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      setStep(3);
    }
  };

  const handlePrevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    } else {
      setStep(1);
    }
  };

  const personaResult = calculatePersonaResult(answers);

  const handleFinishOnboarding = () => {
    setRiskPersona(personaResult.riskPersona);
    setHorizon(personaResult.horizon);
    setIsOnboarded(true);
    onComplete?.(personaResult);
  };

  // Motion transitions
  const stepTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : { type: "spring", stiffness: 320, damping: 28 };

  const contentVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 },
  };

  return (
    <div
      data-testid="onboarding-hero"
      className="fixed inset-0 z-50 overflow-y-auto flex flex-col justify-between bg-gradient-to-b from-slate-950 via-[#100C24] to-[#170E33] text-slate-100"
    >
      {/* Top Header / Progress Bar */}
      <div className="w-full max-w-[520px] mx-auto px-6 pt-6 pb-2">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-white text-base">QuantNiti</span>
          </div>
          <span className="text-xs font-medium text-violet-300/70 uppercase tracking-wider">
            Step {step} of 3
          </span>
        </div>

        <ProgressBar totalSteps={3} currentStep={step} />
      </div>

      {/* Main Step Container */}
      <div className="w-full max-w-[520px] mx-auto px-6 py-4 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* STEP 1: Welcome Splash */}
          {step === 1 && (
            <motion.div
              key="step-1"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="flex flex-col items-center text-center space-y-6 my-auto"
            >
              {/* Hero Badge */}
              <motion.div
                initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 p-[1px] shadow-2xl shadow-violet-600/30"
              >
                <div className="w-full h-full rounded-3xl bg-slate-950/80 backdrop-blur-xl flex items-center justify-center">
                  <TrendingUp className="w-10 h-10 text-violet-400" />
                </div>
              </motion.div>

              {/* Headings */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Intelligent Investing, <br />
                  <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                    Made Simple
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-300/85 max-w-md mx-auto leading-relaxed">
                  AI-driven portfolio intelligence for Indian retail investors. Adaptive baskets,
                  explainable risk guardrails, and automated regime defense.
                </p>
              </div>

              {/* Value Highlights */}
              <div className="w-full grid grid-cols-1 gap-2.5 pt-2 text-left">
                <GlassCard className="p-3.5 flex items-center gap-3 bg-violet-950/30 border-violet-500/20">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-white">Regime-Adaptive Guardrails</p>
                    <p className="text-slate-400">Protects your capital across bull, bear, and sideways regimes.</p>
                  </div>
                </GlassCard>

                <GlassCard className="p-3.5 flex items-center gap-3 bg-violet-950/30 border-violet-500/20">
                  <Target className="w-5 h-5 text-violet-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-white">Personalized Persona Calibrations</p>
                    <p className="text-slate-400">Tailored risk tolerance and compounding horizons.</p>
                  </div>
                </GlassCard>
              </div>

              {/* CTA Button */}
              <div className="w-full pt-4">
                <PrimaryButton
                  fullWidth
                  onClick={() => setStep(2)}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Get Started
                </PrimaryButton>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Persona Quiz */}
          {step === 2 && currentQuestion && (
            <motion.div
              key={`question-${questionIndex}`}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="flex flex-col space-y-6 my-auto"
            >
              {/* Question Meta & Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-violet-400">
                  <span>{currentQuestion.title}</span>
                  <span>
                    Question {questionIndex + 1} of {QUIZ_QUESTIONS.length}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {currentQuestion.prompt}
                </h2>
              </div>

              {/* Option Cards */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = currentAnswer === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectOption(option.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-violet-600/20 border-violet-500 shadow-md shadow-violet-500/20 text-white"
                          : "bg-slate-900/50 hover:bg-slate-900/80 border-violet-500/20 text-slate-200"
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <p className="font-semibold text-sm sm:text-base text-white">
                          {option.title}
                        </p>
                        <p className="text-xs text-slate-300/80 leading-relaxed">
                          {option.subtitle}
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "border-violet-400 bg-violet-600 text-white"
                            : "border-slate-600 bg-slate-800"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <GhostButton
                  onClick={handlePrevQuestion}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Back
                </GhostButton>

                <PrimaryButton
                  disabled={!currentAnswer}
                  onClick={handleNextQuestion}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {questionIndex === QUIZ_QUESTIONS.length - 1 ? "See My Profile" : "Continue"}
                </PrimaryButton>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Personalized Result */}
          {step === 3 && (
            <motion.div
              key="step-3"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="flex flex-col items-center text-center space-y-6 my-auto"
            >
              {/* Badge Reveal */}
              <motion.div
                initial={shouldReduceMotion ? {} : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-300 text-sm font-semibold shadow-lg shadow-violet-500/20"
              >
                <Sliders className="w-4 h-4 text-violet-400" />
                <span>Your Personalized Profile</span>
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-white">
                  You're a{" "}
                  <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
                    {personaResult.title}
                  </span>
                </h2>
                <p className="text-sm text-slate-300/90 leading-relaxed max-w-sm mx-auto">
                  {personaResult.description}
                </p>
              </div>

              {/* Suggested Setup Card */}
              <GlassCard className="w-full p-4 space-y-3 bg-violet-950/40 border-violet-500/30 text-left">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-violet-500/20">
                  <span className="text-slate-400 font-medium">Recommended Horizon:</span>
                  <span className="font-semibold text-violet-300">{personaResult.horizon}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Target Asset Allocation:</p>
                  <p className="text-xs font-semibold text-white">{personaResult.suggestedAllocation}</p>
                </div>
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{personaResult.drawdownGuidance}</span>
                </div>
              </GlassCard>

              {/* Finish CTA */}
              <div className="w-full pt-2">
                <PrimaryButton
                  fullWidth
                  onClick={handleFinishOnboarding}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Enter QuantNiti →
                </PrimaryButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer reassurance */}
      <div className="w-full max-w-[520px] mx-auto px-6 pb-6 text-center">
        <p className="text-xs text-slate-400/60">
          Your risk persona is advisory and can be updated anytime in the Grow tab.
        </p>
      </div>
    </div>
  );
};
