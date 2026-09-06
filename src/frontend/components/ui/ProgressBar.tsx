import React from "react";
import { motion } from "framer-motion";

export interface ProgressBarProps {
  totalSteps: number;
  currentStep: number; // 1-indexed (e.g. 1 to totalSteps)
  className?: string;
  onStepClick?: (step: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalSteps,
  currentStep,
  className = "",
  onStepClick,
}) => {
  return (
    <div
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      className={`w-full flex items-center gap-1.5 ${className}`}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <button
            key={index}
            type="button"
            data-testid="progress-segment"
            disabled={!onStepClick}
            onClick={() => onStepClick?.(stepNum)}
            aria-label={`Step ${stepNum} of ${totalSteps}`}
            className={`relative flex-1 h-1.5 rounded-full overflow-hidden transition-all duration-200 ${
              onStepClick ? "cursor-pointer hover:opacity-80" : "cursor-default"
            } bg-violet-400/20 dark:bg-violet-500/15`}
          >
            <motion.div
              initial={false}
              animate={{
                width: isCompleted ? "100%" : isCurrent ? "100%" : "0%",
                opacity: isCompleted || isCurrent ? 1 : 0,
              }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className={`h-full rounded-full ${
                isCompleted
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600"
                  : isCurrent
                  ? "bg-accent shadow-sm shadow-violet-500/50"
                  : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
