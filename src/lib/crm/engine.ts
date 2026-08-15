import { AGENT_NAME, BRAND_NAME } from "@/lib/property-data";
import { extractRequirements, isCorrection, mergeRequirements } from "./extract";
import { diagnoseNoMatch, recommendProperties } from "./recommend";
import { scoreLead } from "./score";
import { findLeadByVisitor, saveLead } from "./store";
import type { Lead, LeadRequirements, RecommendedProperty } from "./types";

/**
 * The single entry point for every inbound lead message.
 *
 * The website widget calls this today; a WhatsApp webhook would call exactly
 * the same function, so connecting a real number changes the transport only.
 *
 * Sequence: extract → merge → score → answer or ask → recommend → route.
 */

export interface ProcessResult {
  reply: string;
  quickReplies: string[];
  recommended: RecommendedProperty[];
  lead: Lead;
}

interface Question {
  key: keyof LeadRequirements;
  prompt: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    key: "intent",
    prompt: "Are you looking to buy, invest, rent, or sell?",
    options: ["Buy", "Invest", "Rent", "Sell"],
  },
  {
    key: "budgetMax",
    prompt: "What budget are you working to?",
    options: ["Under AED 1M", "AED 1–2M", "AED 2–5M", "AED 5M+"],
  },
  {
    key: "community",
    prompt: "Which area or community are you focused on?",
    options: ["Dubai Marina", "Downtown Dubai", "Palm Jumeirah", "Open to suggestions"],
  },
  {
    key: "propertyType",
    prompt: "What type of property suits you?",
    options: ["Apartment", "Villa", "Townhouse", "Penthouse"],
  },
  {
    key: "bedrooms",
    prompt: "How many bedrooms do you need?",
    options: ["Studio", "1 bedroom", "2 bedrooms", "3+ bedrooms"],
  },
  {
    key: "marketType",
    prompt: "Are you after off-plan or something ready to move into?",
    options: ["Off-plan", "Ready", "Either"],
  },
  {
    key: "timeline",
    prompt: "What's your timeline?",
    options: ["Immediately", "Within 30 days", "1–3 months", "Just exploring"],
  },
  {
    key: "payment",
    prompt: "Will this be a cash purchase or via mortgage?",
    options: ["Cash", "Mortgage", "Not decided"],
  },
];

/** Knowledge the assistant may answer from — never invented. */
const FAQ: Array<{ match: RegExp; answer: string }> = [
  {
    match: /payment plan|instal?ments|post[- ]handover/i,
    answer:
      "Payment plans vary per project. Off-plan stock in the portfolio is typically 80/20 with a portion payable after handover; the exact schedule is confirmed per unit before you commit.",
  },
  {
    match: /\broi\b|yield|return|rental income/i,
    answer:
      "Expected yields in the current portfolio run roughly 5–8% depending on community and unit type. The figure shown on each listing is an estimate — Rahul confirms actuals against comparable rentals.",
  },
  {
    match: /down ?payment|booking amount|deposit/i,
    answer:
      "Off-plan bookings usually start at 10–20% of the price. On a secondary purchase the deposit at Form F stage is normally 10%, held by the registration trustee.",
  },
  {
    match: /\bfees?\b|dld|commission|transfer cost/i,
    answer:
      "Budget for the 4% DLD transfer fee plus admin, a trustee fee of roughly AED 2,000–4,000, and 2% agency commission plus VAT. Mortgage buyers add a 0.25% mortgage registration fee.",
  },
  {
    match: /off[- ]?plan mean|what is off[- ]?plan/i,
    answer:
      "Off-plan means buying from the developer before completion. You pay a booking amount then instalments tied to construction, with the balance at handover. All payments go into a RERA-supervised escrow account.",
  },
  {
    match: /mortgage|finance|loan|ltv/i,
    answer:
      "UAE residents can typically borrow up to 80% on a first property under AED 5M; non-residents usually 50–60%. Rahul introduces independent brokers — rates and eligibility are confirmed by the lender.",
  },
  {
    match: /visa|golden visa/i,
    answer:
      "Property investment at AED 2M or above can qualify for a 10-year Golden Visa. Eligibility is confirmed case by case — Rahul can walk you through the current requirement.",
  },
];

function answerFromKnowledge(message: string): string | null {
  for (const entry of FAQ) {
    if (entry.match.test(message)) return entry.answer;
  }
  return null;
}

function wantsViewing(message: string): boolean {
  return /\bviewing\b|\bvisit\b|\bsee (it|the)\b|\btour\b|\bappointment\b|\bbook\b/i.test(
    message,
  );
}

function nextQuestion(requirements: LeadRequirements): Question | null {
  return QUESTIONS.find((q) => requirements[q.key] === undefined) ?? null;
}

function completeness(requirements: LeadRequirements): number {
  const answered = QUESTIONS.filter((q) => requirements[q.key] !== undefined).length;
  return Math.round((answered / QUESTIONS.length) * 100);
}

function summarise(requirements: LeadRequirements): string {
  const parts: string[] = [];
  if (requirements.intent) parts.push(requirements.intent);
  if (requirements.bedrooms !== undefined)
    parts.push(requirements.bedrooms === 0 ? "studio" : `${requirements.bedrooms} BR`);
  if (requirements.propertyType) parts.push(requirements.propertyType.toLowerCase());
  if (requirements.community) parts.push(`in ${requirements.community}`);
  const budget = requirements.budgetMax ?? requirements.budgetMin;
  if (budget) parts.push(`up to AED ${(budget / 1_000_000).toFixed(2)}M`);
  if (requirements.timeline) parts.push(requirements.timeline.replace(/_/g, " "));
  return parts.length ? parts.join(" · ") : "Enquiry started, requirements not yet captured";
}

function deriveStage(requirements: LeadRequirements, viewing: boolean, recs: number): string {
  if (viewing) return "Viewing requested";
  if (recs > 0) return "Properties suggested";
  if (completeness(requirements) >= 60) return "Qualified";
  if (Object.keys(requirements).length > 0) return "Qualification in progress";
  return "New";
}

function deriveNextAction(lead: Omit<Lead, "nextAction">): string {
  if (lead.viewingRequested) return `Confirm viewing slot — call ${lead.name ?? "lead"} today`;
  if (lead.temperature === "hot") return `Call within 24h — ${AGENT_NAME} to contact personally`;
  if (lead.temperature === "warm") return "Send matching options and follow up in 3 days";
  return "Add to nurture list — re-engage when relevant stock lands";
}

export async function processMessage(input: {
  visitorId: string;
  message: string;
  name?: string;
}): Promise<ProcessResult> {
  const now = new Date().toISOString();
  const existing = await findLeadByVisitor(input.visitorId);

  const extracted = extractRequirements(input.message);
  const requirements = mergeRequirements(
    existing?.requirements ?? {},
    extracted,
    isCorrection(input.message),
  );

  const viewingRequested = (existing?.viewingRequested ?? false) || wantsViewing(input.message);
  const { score, temperature, breakdown } = scoreLead(requirements);

  // Recommend only once there is enough to match on honestly.
  const hasEnough =
    requirements.intent !== undefined &&
    (requirements.budgetMax !== undefined || requirements.community !== undefined);
  const recommended = hasEnough ? recommendProperties(requirements) : [];

  // Reply: a direct answer wins, then recommendations, then the next question.
  const knowledge = answerFromKnowledge(input.message);
  const question = nextQuestion(requirements);
  let reply: string;
  let quickReplies: string[] = [];

  if (knowledge) {
    reply = knowledge;
    if (question) {
      reply += `\n\n${question.prompt}`;
      quickReplies = question.options;
    }
  } else if (viewingRequested && hasEnough) {
    reply = `Happy to arrange that. ${AGENT_NAME} will confirm a slot directly — what day and time suits you best?`;
    quickReplies = ["This week", "This weekend", "Next week"];
  } else if (recommended.length > 0 && !question) {
    reply = `Based on what you've told me, here are the closest options in ${AGENT_NAME}'s portfolio.`;
    quickReplies = ["Book a viewing", "What's the payment plan?", "Show me more"];
  } else if (question) {
    const prefix = existing ? "" : `Welcome to ${BRAND_NAME}. `;
    reply = `${prefix}${question.prompt}`;
    quickReplies = question.options;
  } else if (recommended.length > 0) {
    reply = `Here are the strongest matches in ${AGENT_NAME}'s current portfolio.`;
    quickReplies = ["Book a viewing", "What's the payment plan?"];
  } else {
    reply = diagnoseNoMatch(requirements);
    quickReplies = ["Book a call", "Widen my budget"];
  }

  const conversation = [
    ...(existing?.conversation ?? []),
    { role: "lead" as const, text: input.message, at: now },
    { role: "assistant" as const, text: reply, at: now },
  ];

  const base = {
    id: existing?.id ?? `lead_${Math.random().toString(36).slice(2, 10)}`,
    visitorId: input.visitorId,
    name: input.name ?? existing?.name,
    phone: existing?.phone,
    requirements,
    score,
    temperature,
    breakdown,
    conversation,
    recommended: recommended.length ? recommended : (existing?.recommended ?? []),
    stage: deriveStage(requirements, viewingRequested, recommended.length),
    summary: summarise(requirements),
    viewingRequested,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const lead: Lead = { ...base, nextAction: deriveNextAction(base) };
  await saveLead(lead);

  return { reply, quickReplies, recommended: lead.recommended, lead };
}
