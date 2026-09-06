import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ChipButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  selected?: boolean;
  active?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const ChipButton: React.FC<ChipButtonProps> = ({
  children,
  selected = false,
  active = false,
  icon,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) => {
  const isSelected = selected || active;

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      type={type}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border disabled:opacity-50 disabled:pointer-events-none ${
        isSelected
          ? "bg-accent text-white border-accent shadow-sm shadow-violet-500/20"
          : "bg-[var(--bg-card-subtle)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-violet-400/40 hover:bg-violet-500/5"
      } ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  );
};
