import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAbortableRequest } from "../../hooks/useAbortableRequest";
import { ProgressBar } from "../ui/ProgressBar";
import { PrimaryButton } from "../ui/PrimaryButton";
import { SummaryPills } from "./SummaryPills";
import { Step1Capital } from "./Step1Capital";
import { Step2Horizon } from "./Step2Horizon";
import { Step3Persona } from "./Step3Persona";
import { Step4ResultsOverview } from "./Step4ResultsOverview";
import { Step5DeepDive } from "./Step5DeepDive";
import { GrowSkeleton } from "./GrowSkeleton";

export function GrowPage() {
  const shouldReduceMotion = useReducedMotion();
  const {
    capital,
    setCapital,
    horizon,
    setHorizon,
    riskPersona,
    setRiskPersona,
    currentBasket,
    setCurrentBasket,
    setActiveTab,
  } = useAppStore();

  const { request, isLoading, error } = useAbortableRequest();

  // Guided flow state: 1 (Capital) -> 2 (Horizon) -> 3 (Persona) -> 4 (Results) -> 5 (Deep Dive)
  const [step, setStep] = useState<number>(currentBasket ? 4 : 1);
  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");

  const goToStep = (nextStep: number) => {
    setSlideDirection(nextStep > step ? "forward" : "backward");
    setStep(nextStep);
  };

  const handleGenerateBasket = async () => {
    setSlideDirection("forward");
    try {
      const response = await request(
        "basket-generation",
        "/api/v1/grow/recommend",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            capital,
            horizon,
            risk_persona: riskPersona,
          }),
        }
      );

      if (response) {
        setCurrentBasket(response);
        setStep(4);
      }
    } catch (err) {
      console.error("Failed to generate AI basket:", err);
    }
  };

  const handleTrackInPortfolio = async () => {
    // If basket exists, attempt activation or navigate to portfolio tab
    if (currentBasket?.basket_id) {
      try {
        await request(
          "portfolio-activation",
          "/api/v1/portfolios/activate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              basket_id: currentBasket.basket_id,
              name: `Virtual Paper Basket (${riskPersona})`,
            }),
          }
        );
      } catch {
        // Fallback gracefully
      }
    }
    setActiveTab("portfolio");
  };

  // Motion variants for horizontal slide
  const slideVariants = {
    enter: (direction: string) => ({
      x: shouldReduceMotion ? 0 : direction === "forward" ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      x: shouldReduceMotion ? 0 : direction === "forward" ? -30 : 30,
      opacity: 0,
    }),
  };

  const slideTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : { type: "spring", stiffness: 300, damping: 25 };

  return (
    <div className="flex flex-col min-h-full pb-20 p-4 space-y-4">
      {/* Top Header / Progress Area */}
      <div className="space-y-3">
        {/* Step indicator pills */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>
              Grow Page • {step <= 3 ? `Wizard Step ${step} of 3` : step === 4 ? "Results Overview" : "Deep Dive"}
            </span>
          </span>

          {step >= 4 && (
            <div className="flex items-center gap-1 bg-violet-950/40 border border-violet-500/20 rounded-full p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => goToStep(4)}
                className={`px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                  step === 4 ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => goToStep(5)}
                className={`px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                  step === 5 ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Deep Dive
              </button>
            </div>
          )}
        </div>

        {/* Segmented Progress Bar */}
        {step <= 3 ? (
          <ProgressBar totalSteps={3} currentStep={step} />
        ) : (
          <div className="w-full flex items-center gap-1.5">
            <div className="h-1.5 flex-1 rounded-full bg-violet-600" />
            <div className="h-1.5 flex-1 rounded-full bg-violet-600" />
            <div className="h-1.5 flex-1 rounded-full bg-violet-600" />
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step >= 4 ? "bg-accent shadow-sm shadow-violet-500/50" : "bg-violet-400/20"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step === 5 ? "bg-accent shadow-sm shadow-violet-500/50" : "bg-violet-400/20"
              }`}
            />
          </div>
        )}

        {/* Collapsed summary pills for completed wizard steps */}
        <SummaryPills
          currentStep={step}
          capital={capital}
          horizon={horizon}
          riskPersona={riskPersona}
          onEditStep={goToStep}
        />
      </div>

      {/* Main Slideable Content */}
      <div className="relative min-h-[360px]">
        {isLoading ? (
          <GrowSkeleton />
        ) : (
          <AnimatePresence mode="wait" custom={slideDirection}>
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                <Step1Capital
                  capital={capital}
                  onCapitalChange={setCapital}
                  onNext={() => goToStep(2)}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                <Step2Horizon
                  horizon={horizon}
                  onHorizonChange={setHorizon}
                  onNext={() => goToStep(3)}
                  onBack={() => goToStep(1)}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="space-y-4"
              >
                <Step3Persona
                  riskPersona={riskPersona}
                  onPersonaChange={setRiskPersona}
                  onNext={handleGenerateBasket}
                  onBack={() => goToStep(2)}
                />
              </motion.div>
            )}

            {step === 4 && currentBasket && (
              <motion.div
                key="step-4"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                <Step4ResultsOverview
                  basket={currentBasket}
                  onTrackInPortfolio={handleTrackInPortfolio}
                  onSeeDeepDive={() => goToStep(5)}
                  onBackToWizard={() => goToStep(1)}
                />
              </motion.div>
            )}

            {step === 5 && currentBasket && (
              <motion.div
                key="step-5"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                <Step5DeepDive
                  basket={currentBasket}
                  onBackToResults={() => goToStep(4)}
                  onTrackInPortfolio={handleTrackInPortfolio}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Sticky Bottom "Generate AI Basket" CTA for Step 3 */}
      {step === 3 && !isLoading && (
        <div className="sticky bottom-0 inset-x-0 pt-3 pb-2 bg-[var(--bg-primary)]/80 backdrop-blur-md border-t border-violet-500/20 -mx-4 px-4 z-20">
          <PrimaryButton
            fullWidth
            onClick={handleGenerateBasket}
            disabled={isLoading}
            loading={isLoading}
            icon={<Wand2 className="w-4 h-4" />}
          >
            Generate AI Basket
          </PrimaryButton>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {error.message || "Failed to generate basket. Please retry."}
        </div>
      )}
    </div>
  );
}
