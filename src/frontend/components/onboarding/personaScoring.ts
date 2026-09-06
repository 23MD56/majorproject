import { QuizQuestion, QuizAnswers, PersonaResult } from "./types";
import { RiskPersona, TimeHorizon } from "../../store/useAppStore";

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1_drawdown",
    title: "Scenario 1: Market Volatility",
    prompt: "Your stocks dropped 15% in a week — what do you do?",
    options: [
      {
        id: "sell",
        title: "Exit & preserve cash",
        subtitle: "Move to safe assets immediately to avoid further drawdown.",
        riskMapping: "Conservative",
      },
      {
        id: "hold",
        title: "Hold steady & rebalance",
        subtitle: "Stay calm, review fundamentals, and let regime models adapt.",
        riskMapping: "Balanced",
      },
      {
        id: "buy",
        title: "Buy the dip aggressively",
        subtitle: "Deploy surplus capital to acquire quality assets at a discount.",
        riskMapping: "Aggressive",
      },
    ],
  },
  {
    id: "q2_horizon",
    title: "Scenario 2: Investment Horizon",
    prompt: "How long can you leave your money invested without needing it?",
    options: [
      {
        id: "short",
        title: "1 to 3 Months",
        subtitle: "Short-term capital preservation with immediate liquidity needs.",
        horizonMapping: "3M",
        riskMapping: "Conservative",
      },
      {
        id: "medium",
        title: "3 to 6 Months",
        subtitle: "Medium-term growth aiming for cyclical momentum gains.",
        horizonMapping: "6M",
        riskMapping: "Balanced",
      },
      {
        id: "long",
        title: "1 Year or Longer",
        subtitle: "Patience for multi-quarter compounding and regime recovery.",
        horizonMapping: "12M",
        riskMapping: "Aggressive",
      },
    ],
  },
  {
    id: "q3_priority",
    title: "Scenario 3: Investment Priority",
    prompt: "What matters more to you?",
    options: [
      {
        id: "safety",
        title: "Capital Safety",
        subtitle: "Minimizing maximum drawdown and sleeping peacefully at night.",
        riskMapping: "Conservative",
      },
      {
        id: "returns",
        title: "Risk-Adjusted Returns",
        subtitle: "Optimal Sharpe ratio and balanced long-term factor growth.",
        riskMapping: "Balanced",
      },
      {
        id: "esg",
        title: "ESG & Sustainability",
        subtitle: "Ethical companies with high governance and sustainability standards.",
        riskMapping: "ESG-Conscious",
      },
    ],
  },
];

const PERSONA_DETAILS: Record<
  RiskPersona,
  {
    title: string;
    badgeText: string;
    description: string;
    suggestedAllocation: string;
    drawdownGuidance: string;
  }
> = {
  Conservative: {
    title: "Conservative Investor",
    badgeText: "Conservative",
    description:
      "You prioritize capital safety and downside preservation. Your portfolio emphasizes sovereign debt, gold ETFs, and low-volatility large caps to withstand turbulent regimes.",
    suggestedAllocation: "25% Equities • 50% G-Sec/Debt • 25% Gold ETF",
    drawdownGuidance: "Target Max Drawdown: < 6%",
  },
  Balanced: {
    title: "Balanced Investor",
    badgeText: "Balanced",
    description:
      "You seek steady, risk-adjusted returns through disciplined regime adaptation. Your portfolio combines defensive cushions with selective momentum equities.",
    suggestedAllocation: "50% Equities • 35% G-Sec/Debt • 15% Gold ETF",
    drawdownGuidance: "Target Max Drawdown: 8–12%",
  },
  Aggressive: {
    title: "Aggressive Investor",
    badgeText: "Aggressive",
    description:
      "You have high risk tolerance and an appetite for upside compounding. You can endure sharp market swings to maximize factor alpha and equity momentum.",
    suggestedAllocation: "75% Equities • 15% Commodities • 10% Cash Buffer",
    drawdownGuidance: "Target Max Drawdown: 15–20%",
  },
  "ESG-Conscious": {
    title: "ESG-Conscious Investor",
    badgeText: "ESG-Conscious",
    description:
      "You believe capital should generate wealth while advancing ethical and sustainable standards. Your basket filters for top-quartile ESG Conscience Scores.",
    suggestedAllocation: "60% High-ESG Equities • 30% Green Bonds • 10% Gold ETF",
    drawdownGuidance: "Target Max Drawdown: 10–14%",
  },
};

export function calculatePersonaResult(answers: QuizAnswers): PersonaResult {
  const { q1_drawdown, q2_horizon, q3_priority } = answers;

  let riskPersona: RiskPersona = "Balanced";
  let horizon: TimeHorizon = "6M";

  // Determine horizon
  if (q2_horizon === "short") {
    horizon = "3M";
  } else if (q2_horizon === "long") {
    horizon = "12M";
  } else {
    horizon = "6M";
  }

  // Determine persona
  if (q3_priority === "esg") {
    riskPersona = "ESG-Conscious";
  } else if (q1_drawdown === "sell" && (q3_priority === "safety" || q2_horizon === "short")) {
    riskPersona = "Conservative";
  } else if (q1_drawdown === "buy" && (q3_priority === "returns" || q2_horizon === "long")) {
    riskPersona = "Aggressive";
  } else if (q3_priority === "safety") {
    riskPersona = "Conservative";
  } else if (q1_drawdown === "buy") {
    riskPersona = "Aggressive";
  } else {
    riskPersona = "Balanced";
  }

  const details = PERSONA_DETAILS[riskPersona];

  return {
    riskPersona,
    horizon,
    title: details.title,
    badgeText: details.badgeText,
    description: details.description,
    suggestedAllocation: details.suggestedAllocation,
    drawdownGuidance: details.drawdownGuidance,
  };
}
