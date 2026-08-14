import type { LeadRequirements, ScoreBreakdown, Temperature } from "./types";

/**
 * Deterministic lead scoring, 0–100.
 *
 * Every point is traceable to a stored signal, so the number an advisor sorts
 * on is reproducible rather than a model's opinion.
 */

const TIMELINE_POINTS: Record<string, number> = {
  immediate: 25,
  within_1_month: 22,
  within_3_months: 15,
  within_6_months: 8,
  just_exploring: 0,
};

export function scoreLead(requirements: LeadRequirements): {
  score: number;
  temperature: Temperature;
  breakdown: ScoreBreakdown[];
} {
  const breakdown: ScoreBreakdown[] = [];
  const add = (label: string, points: number) => {
    if (points > 0) breakdown.push({ label, points });
  };

  // Budget — the strongest single signal
  const budget = requirements.budgetMax ?? requirements.budgetMin;
  if (budget) {
    if (budget >= 5_000_000) add("Budget AED 5M+", 25);
    else if (budget >= 2_000_000) add("Budget AED 2M–5M", 20);
    else if (budget >= 1_000_000) add("Budget AED 1M–2M", 14);
    else add("Budget stated", 8);
  }

  if (requirements.timeline) {
    add(`Timeline: ${requirements.timeline.replace(/_/g, " ")}`, TIMELINE_POINTS[requirements.timeline] ?? 0);
  }

  if (requirements.payment === "cash") add("Cash buyer", 15);
  else if (requirements.payment === "mortgage") add("Mortgage route", 8);

  if (requirements.intent === "buy") add("Intent: buy", 10);
  else if (requirements.intent === "invest") add("Intent: invest", 10);
  else if (requirements.intent === "rent") add("Intent: rent", 5);
  else if (requirements.intent === "sell") add("Intent: sell", 6);

  if (requirements.community) add("Location specified", 8);
  if (requirements.bedrooms !== undefined) add("Layout specified", 5);
  if (requirements.propertyType) add("Property type specified", 5);
  if (requirements.marketType) add("Off-plan / ready decided", 4);
  if (requirements.purpose) add("Purpose known", 3);

  const raw = breakdown.reduce((sum, item) => sum + item.points, 0);
  const score = Math.max(0, Math.min(100, raw));
  const temperature: Temperature = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";

  return { score, temperature, breakdown };
}
