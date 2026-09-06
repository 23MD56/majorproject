import { RiskPersona, TimeHorizon } from "../../store/useAppStore";

export interface QuizOption {
  id: string;
  title: string;
  subtitle: string;
  riskMapping?: RiskPersona;
  horizonMapping?: TimeHorizon;
}

export interface QuizQuestion {
  id: "q1_drawdown" | "q2_horizon" | "q3_priority";
  title: string;
  prompt: string;
  options: QuizOption[];
}

export interface QuizAnswers {
  q1_drawdown?: string;
  q2_horizon?: string;
  q3_priority?: string;
}

export interface PersonaResult {
  riskPersona: RiskPersona;
  horizon: TimeHorizon;
  title: string;
  badgeText: string;
  description: string;
  suggestedAllocation: string;
  drawdownGuidance: string;
}
