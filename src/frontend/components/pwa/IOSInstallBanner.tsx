import React, { useState, useEffect } from "react";
import { Share, PlusSquare, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isIOSSafariBannerEligible,
  dismissIOSSafariBanner,
} from "../../services/pwaService";

interface IOSInstallBannerProps {
  forceShow?: boolean;
}

export const IOSInstallBanner: React.FC<IOSInstallBannerProps> = ({ forceShow = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (forceShow || isIOSSafariBannerEligible()) {
      setIsVisible(true);
    }
  }, [forceShow]);

  const handleDismiss = () => {
    dismissIOSSafariBanner();
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          aria-label="iOS Safari Install Instructions"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-20 left-4 right-4 max-w-[488px] mx-auto z-40 p-4 rounded-2xl bg-gradient-to-r from-violet-950/95 via-purple-950/95 to-slate-900/95 border border-violet-500/30 text-white shadow-2xl shadow-violet-950/40 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white tracking-tight">
                  Install QuantNiti on iPhone
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Install for fullscreen regime alerts and zero-latency trading tools. Tap{" "}
                  <span className="inline-flex items-center gap-0.5 font-semibold text-violet-300 px-1 py-0.5 rounded bg-violet-500/20">
                    <Share className="w-3 h-3 inline" /> Share
                  </span>{" "}
                  below, then select{" "}
                  <span className="inline-flex items-center gap-0.5 font-semibold text-violet-300 px-1 py-0.5 rounded bg-violet-500/20">
                    <PlusSquare className="w-3 h-3 inline" /> Add to Home Screen
                  </span>
                  .
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss iOS Install Banner"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
