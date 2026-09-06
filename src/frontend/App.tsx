import { useState } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { useAppStore } from "./store/useAppStore";
import { Sun, Moon, ShieldCheck, Sparkles, Layers } from "lucide-react";
import {
  GlassCard,
  PrimaryButton,
  GhostButton,
  ChipButton,
  SegmentedControl,
  ModalSheet,
  ProgressBar,
  AnimatedNumber,
  RegimeBadge,
  LearnChip,
} from "./components/ui";

function ShellContent() {
  const { theme, toggleTheme } = useTheme();
  const { capital, horizon, riskPersona, setCapital } = useAppStore();

  const [selectedSegment, setSelectedSegment] = useState("overview");
  const [selectedPreset, setSelectedPreset] = useState<number>(capital);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(2);

  const handleSimulateAction = () => {
    setIsBtnLoading(true);
    setTimeout(() => {
      setIsBtnLoading(false);
    }, 1200);
  };

  const handleChipClick = (amount: number) => {
    setSelectedPreset(amount);
    setCapital(amount);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col items-center p-4 transition-colors duration-200">
      {/* Mobile-first Shell Container */}
      <div className="w-full max-w-[520px] flex flex-col gap-5 pb-12">
        
        {/* Header Bar */}
        <header className="flex items-center justify-between py-3 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-violet-500/20">
              Q
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none text-[var(--text-main)]">
                QuantNiti
              </h1>
              <span className="text-[10px] text-accent font-semibold tracking-wider uppercase">
                Algorithmic Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RegimeBadge regime="BULL" size="sm" />
            <button
              data-testid="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-violet-500/10 text-accent transition-colors duration-150"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Wizard Progress Demo */}
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
            <span>Wizard Progress</span>
            <span className="text-accent">Step {wizardStep} of 3</span>
          </div>
          <ProgressBar
            totalSteps={3}
            currentStep={wizardStep}
            onStepClick={(step) => setWizardStep(step)}
          />
        </div>

        {/* Hero Card */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Scaffold Initialized
              </span>
            </div>
            <LearnChip concept="Theme Tokens" onClick={() => setIsModalOpen(true)} />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            Violet & Indigo Theme Ready
          </h2>
          
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Welcome to the new React + Vite architecture. Tailwind CSS v3 tokens, Zustand store, and Framer Motion are fully wired.
          </p>

          {/* Animated Capital & Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-1 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-muted)]">Capital</span>
              <span className="text-xs font-bold font-mono text-accent">
                ₹<AnimatedNumber value={selectedPreset} formatter={(v) => Math.round(v).toLocaleString("en-IN")} />
              </span>
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
        </GlassCard>

        {/* Ticket 03 Shared Components Showcase */}
        <GlassCard className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-sm tracking-tight text-[var(--text-main)]">
              Ticket 03: Shared Component Showcase
            </h3>
          </div>

          {/* Segmented Control */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[var(--text-muted)] font-medium">SegmentedControl:</span>
            <SegmentedControl
              options={[
                { value: "overview", label: "Overview" },
                { value: "holdings", label: "Holdings" },
                { value: "quantlab", label: "Quant Lab" },
              ]}
              value={selectedSegment}
              onChange={setSelectedSegment}
            />
          </div>

          {/* Preset Chips */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[var(--text-muted)] font-medium">ChipButton (Quick Capital Pick):</span>
            <div className="flex flex-wrap gap-2">
              {[10000, 25000, 50000, 100000].map((amt) => (
                <ChipButton
                  key={amt}
                  selected={selectedPreset === amt}
                  onClick={() => handleChipClick(amt)}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </ChipButton>
              ))}
            </div>
          </div>

          {/* Regime Badges */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[var(--text-muted)] font-medium">RegimeBadge:</span>
            <div className="flex flex-wrap gap-2">
              <RegimeBadge regime="BULL" />
              <RegimeBadge regime="SIDEWAYS" />
              <RegimeBadge regime="BEAR" />
            </div>
          </div>

          {/* Buttons Showcase */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)] font-medium">PrimaryButton & GhostButton:</span>
            <div className="flex items-center gap-3">
              <PrimaryButton
                loading={isBtnLoading}
                onClick={handleSimulateAction}
                fullWidth
              >
                {isBtnLoading ? "Optimizing..." : "Simulate Action"}
              </PrimaryButton>
              <GhostButton onClick={() => setIsModalOpen(true)}>
                Open Sheet
              </GhostButton>
            </div>
          </div>
        </GlassCard>

        {/* Modal Sheet Component */}
        <ModalSheet
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Component Library Preview"
        >
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              This is the <strong>ModalSheet</strong> bottom-sheet overlay from Ticket 03. It features:
            </p>
            <ul className="text-xs text-[var(--text-muted)] space-y-2 list-disc pl-5">
              <li>Backdrop blur and tap-outside dismiss</li>
              <li>Framer Motion physics-based slide-up spring</li>
              <li>Top drag handle indicator</li>
              <li>Automatic body scroll lock when open</li>
            </ul>
            <PrimaryButton fullWidth onClick={() => setIsModalOpen(false)}>
              Got it, close sheet
            </PrimaryButton>
          </div>
        </ModalSheet>

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
