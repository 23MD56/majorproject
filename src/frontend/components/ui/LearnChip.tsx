import React from "react";
import { HelpCircle } from "lucide-react";

export interface LearnChipProps {
  concept?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const LearnChip: React.FC<LearnChipProps> = ({
  concept,
  children,
  onClick,
  className = "",
}) => {
  const content = children || concept || "Learn";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Learn more about ${concept || "concept"}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-accent bg-violet-500/10 hover:bg-violet-500/15 border border-violet-400/20 active:scale-95 transition-all duration-150 ${className}`}
    >
      <HelpCircle className="w-3 h-3 text-accent" />
      <span>{content}</span>
    </button>
  );
};
