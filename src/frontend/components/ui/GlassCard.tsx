import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { fadeInUpVariants } from "./transitions";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  highlight?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  delay = 0,
  highlight = true,
  ...props
}) => {
  return (
    <motion.div
      variants={fadeInUpVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      className={`relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-violet-400/20 dark:border-violet-500/15 backdrop-blur-md shadow-[0_4px_24px_-4px_rgba(124,58,237,0.06)] transition-colors duration-200 ${
        highlight
          ? "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-violet-400/30 dark:before:via-violet-400/20 before:to-transparent"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
