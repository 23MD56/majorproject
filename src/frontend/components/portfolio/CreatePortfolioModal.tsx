import React, { useState } from "react";
import { PlusCircle, Target, Wallet, Shield } from "lucide-react";
import { ModalSheet } from "../ui/ModalSheet";
import { PrimaryButton } from "../ui/PrimaryButton";
import { GhostButton } from "../ui/GhostButton";
import { SegmentedControl } from "../ui/SegmentedControl";
import { RiskPersona } from "../../store/useAppStore";

interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    capital: number;
    riskPersona: RiskPersona;
  }) => Promise<void> | void;
  onOpenGrowWizard?: () => void;
}

const PERSONA_OPTIONS: { label: string; value: RiskPersona }[] = [
  { label: "Conservative", value: "Conservative" },
  { label: "Balanced", value: "Balanced" },
  { label: "Aggressive", value: "Aggressive" },
  { label: "ESG", value: "ESG-Conscious" },
];

export const CreatePortfolioModal: React.FC<CreatePortfolioModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onOpenGrowWizard,
}) => {
  const [name, setName] = useState("Retirement 2040");
  const [capital, setCapital] = useState(100000);
  const [persona, setPersona] = useState<RiskPersona>("Balanced");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        capital: Number(capital),
        riskPersona: persona,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} title="Create New Goal Portfolio">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Portfolio Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-accent" />
            Portfolio / Goal Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dream House, Retirement 2040"
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-accent transition-colors shadow-sm"
          />
        </div>

        {/* Initial Capital */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-accent" />
            Initial Virtual Capital (₹)
          </label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Math.max(1000, Number(e.target.value)))}
            step={5000}
            min={1000}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] text-sm focus:outline-none focus:border-accent transition-colors shadow-sm"
          />
        </div>

        {/* Risk Persona */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-accent" />
            Risk Persona
          </label>
          <SegmentedControl
            options={PERSONA_OPTIONS}
            value={persona}
            onChange={(val) => setPersona(val as RiskPersona)}
          />
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-3">
          <PrimaryButton
            type="submit"
            onClick={handleSubmit}
            fullWidth
            disabled={isSubmitting || !name.trim()}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            {isSubmitting ? "Creating..." : "Create Virtual Portfolio"}
          </PrimaryButton>

          {onOpenGrowWizard && (
            <GhostButton
              type="button"
              fullWidth
              onClick={() => {
                onClose();
                onOpenGrowWizard();
              }}
            >
              Or Build Guided Basket via Grow Wizard →
            </GhostButton>
          )}
        </div>
      </form>
    </ModalSheet>
  );
};
