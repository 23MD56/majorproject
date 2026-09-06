import { useEffect } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useAppStore, NavTab } from "../../store/useAppStore";
import {
  HomePage,
  ExplorePage,
  GrowPage,
  PortfolioPage,
} from "../../routes/PlaceholderPages";

export function AppShell() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { activeTab, setActiveTab } = useAppStore();

  // Keep route pathname in sync with activeTab in Zustand store
  useEffect(() => {
    const rawPath = location.pathname.replace(/^\//, "").toLowerCase();
    const validTabs: NavTab[] = ["home", "explore", "grow", "portfolio"];
    if (validTabs.includes(rawPath as NavTab)) {
      setActiveTab(rawPath as NavTab);
    }
  }, [location.pathname, setActiveTab]);

  // Motion variants respecting reduced motion preferences
  const pageVariants = {
    initial: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 20 },
    animate: shouldReduceMotion
      ? { opacity: 1 }
      : { opacity: 1, y: 0 },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: -10 },
  };

  const pageTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : { type: "spring", stiffness: 300, damping: 25 };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex justify-center transition-colors duration-200">
      {/* Container constrained to max-w-[520px] on desktop with centered shadow, full-width on mobile */}
      <div className="w-full max-w-[520px] min-h-screen flex flex-col bg-[var(--bg-primary)] shadow-2xl shadow-violet-950/5 relative border-x border-[var(--border-subtle)]">
        {/* Sticky Header */}
        <Header />

        {/* Scrollable Content Area with bottom nav clearance */}
        <main className="flex-1 overflow-y-auto pb-24 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="w-full h-full"
            >
              <Routes location={location}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/grow" element={<GrowPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
