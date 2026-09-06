import { describe, it, expect } from "vitest";
import {
  calculatePersonaResult,
  QUIZ_QUESTIONS,
} from "../../../../src/frontend/components/onboarding/personaScoring";

describe("Persona Scoring Engine", () => {
  it("provides 3 well-structured scenario questions", () => {
    expect(QUIZ_QUESTIONS).toHaveLength(3);
    expect(QUIZ_QUESTIONS[0].id).toBe("q1_drawdown");
    expect(QUIZ_QUESTIONS[1].id).toBe("q2_horizon");
    expect(QUIZ_QUESTIONS[2].id).toBe("q3_priority");

    QUIZ_QUESTIONS.forEach((q) => {
      expect(q.prompt).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      q.options.forEach((opt) => {
        expect(opt.id).toBeTruthy();
        expect(opt.title).toBeTruthy();
        expect(opt.subtitle).toBeTruthy();
      });
    });
  });

  it("classifies as Conservative when user prioritizes capital safety and exits on drop", () => {
    const result = calculatePersonaResult({
      q1_drawdown: "sell",
      q2_horizon: "short",
      q3_priority: "safety",
    });

    expect(result.riskPersona).toBe("Conservative");
    expect(result.horizon).toBe("3M");
    expect(result.title).toContain("Conservative");
    expect(result.description).toMatch(/capital safety|preservation|drawdown/i);
  });

  it("classifies as Aggressive when user buys dip and invests for long-term compounding", () => {
    const result = calculatePersonaResult({
      q1_drawdown: "buy",
      q2_horizon: "long",
      q3_priority: "returns",
    });

    expect(result.riskPersona).toBe("Aggressive");
    expect(result.horizon).toBe("12M");
    expect(result.title).toContain("Aggressive");
    expect(result.description).toMatch(/compounding|growth|upside/i);
  });

  it("classifies as ESG-Conscious when user prioritizes ethical and sustainability impact", () => {
    const result = calculatePersonaResult({
      q1_drawdown: "hold",
      q2_horizon: "medium",
      q3_priority: "esg",
    });

    expect(result.riskPersona).toBe("ESG-Conscious");
    expect(result.horizon).toBe("6M");
    expect(result.title).toContain("ESG-Conscious");
    expect(result.description).toMatch(/sustainability|governance|esg/i);
  });

  it("classifies as Balanced for moderate responses", () => {
    const result = calculatePersonaResult({
      q1_drawdown: "hold",
      q2_horizon: "medium",
      q3_priority: "returns",
    });

    expect(result.riskPersona).toBe("Balanced");
    expect(result.horizon).toBe("6M");
    expect(result.title).toContain("Balanced");
    expect(result.description).toMatch(/balance|steady|risk-adjusted/i);
  });

  it("gracefully falls back to Balanced if answers are empty or partial", () => {
    const result = calculatePersonaResult({});
    expect(result.riskPersona).toBe("Balanced");
    expect(result.horizon).toBe("6M");
  });
});
