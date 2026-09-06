import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { useAppStore } from "./store/useAppStore";
import { Sun, Moon, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

function ShellContent() {
  const { theme, toggleTheme } = useTheme();
  const { capital, horizon, riskPersona } = useAppStore();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col items-center p-4 transition-colors duration-200">
      {/* Mobile-first Shell Container */}
      <div className="w-full max-w-[520px] flex flex-col gap-6">
        
        {/* Header Bar */}
        <header className="flex items-center justify-between py-3 px-4 rounded-squircle-md bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-squircle-sm bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-violet-500/20">
              Q
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none text-[var(--text-main)]">
                QuantNiti
              </h1>
              <span className="text-[10px] text-accent font-medium tracking-wide uppercase">
                Algorithmic Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              data-testid="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-squircle-sm bg-[var(--bg-card-subtle)] hover:bg-violet-500/10 text-accent transition-colors duration-150"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Hero / Scaffold Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-squircle-lg p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 text-accent">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Scaffold Initialized
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            Violet & Indigo Theme Ready
          </h2>
          
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Welcome to the new React + Vite architecture. Tailwind CSS v3 tokens, Zustand store, and Framer Motion are fully wired.
          </p>

          <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-muted)]">Capital</span>
              <span className="text-xs font-bold font-mono">₹{capital.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-muted)]">Horizon</span>
              <span className="text-xs font-bold">{horizon}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-muted)]">Persona</span>
              <span className="text-xs font-bold text-accent">{riskPersona}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-profit text-xs font-semibold mt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>PWA & Desktop Shell Verified</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ShellContent />
    </ThemeProvider>
  );
}
