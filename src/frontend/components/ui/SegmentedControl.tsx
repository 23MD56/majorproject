import React, { useId } from "react";
import { motion } from "framer-motion";
import { springTransition } from "./transitions";

export interface SegmentedOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: (SegmentedOption | string)[];
  value: string;
  onChange: (value: string) => void;
  layoutId?: string;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  layoutId,
  className = "",
}) => {
  const generatedId = useId();
  const activeLayoutId = layoutId || `segmented-pill-${generatedId}`;

  const normalizedOptions: SegmentedOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  return (
    <div
      role="tablist"
      className={`relative inline-flex p-1 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] backdrop-blur-sm ${className}`}
    >
      {normalizedOptions.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150 ${
              isActive
                ? "text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={activeLayoutId}
                transition={springTransition}
                className="absolute inset-0 z-[-1] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-sm shadow-violet-500/25"
              />
            )}
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
