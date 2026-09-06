import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { slideUpVariants } from "./transitions";

export interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export const ModalSheet: React.FC<ModalSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  showCloseButton = true,
}) => {
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop Blur */}
          <motion.div
            data-testid="modal-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={slideUpVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative z-10 w-full max-w-[520px] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[var(--bg-card)] border-t border-x border-violet-400/20 dark:border-violet-500/20 shadow-2xl p-6 flex flex-col gap-4 ${className}`}
          >
            {/* Drag handle bar */}
            <div className="w-full flex justify-center pb-1">
              <div
                data-testid="modal-sheet-handle"
                className="w-10 h-1.5 rounded-full bg-violet-400/30 dark:bg-violet-400/20"
              />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
                {typeof title === "string" ? (
                  <h3 className="font-bold text-lg text-[var(--text-main)]">
                    {title}
                  </h3>
                ) : (
                  <div>{title}</div>
                )}

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="p-1.5 rounded-full hover:bg-violet-500/10 text-[var(--text-muted)] hover:text-accent transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
