import { AGENT_NAME } from "@/lib/property-data";
import {
  acknowledge,
  bridgeToQuestion,
  detectSmallTalk,
  handoffLine,
  smallTalkReply,
} from "./conversation";
import {
  extractAvailability,
  extractRequirements,
  isCorrection,
  mergeRequirements,
  saysNoPreference,
  wantsCall,
  wantsViewing,
} from "./extract";
import { diagnoseNoMatch, recommendProperties } from "./recommend";
import { scoreLead } from "./score";
import { deleteLeadByVisitor, findLeadByVisitor, saveLead } from "./store";
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

/**
 * What we ask, in order.
 *
 * Three questions, not eight. Everything else — bedrooms, property type,
 * off-plan, payment — is captured when the lead mentions it, but is never
 * asked for. A buyer who wanted to fill in eight fields would have used the
 * form on the website.
 *
 * No option lists: on WhatsApp a numbered menu invites one-word replies and
 * makes the whole thing feel like an IVR. The extractor handles free text,
 * so let people type.
 */
const QUESTIONS: Question[] = [
  {
    key: "intent",
    prompt: "What are you looking for?",
    options: [],
  },
  {
    key: "budgetMax",
    prompt: "What budget are you working with?",
    options: [],
  },
  {
    key: "community",
    prompt: "Any particular area in mind?",
    options: [],
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

function nextQuestion(requirements: LeadRequirements): Question | null {
  const skipped = requirements.skipped ?? [];
  return (
    QUESTIONS.find(
      (q) => requirements[q.key] === undefined && !skipped.includes(q.key),
    ) ?? null
  );
}

/** Marks a field as settled so the flow moves on instead of repeating. */
function skip(requirements: LeadRequirements, key: string): LeadRequirements {
  const skipped = new Set(requirements.skipped ?? []);
  skipped.add(key);
  return { ...requirements, skipped: [...skipped] };
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

  // Demo escape hatch: start the conversation over from this number.
  if (/^(reset|restart|start over|new chat|clear)$/i.test(input.message.trim())) {
    await deleteLeadByVisitor(input.visitorId);
    const fresh = await processMessage({ ...input, message: "hi" });
    return {
      ...fresh,
      reply: `Conversation reset.

${fresh.reply}`,
    };
  }

  const existing = await findLeadByVisitor(input.visitorId);

  // WhatsApp renders quick replies as a numbered list, so "2" is a normal
  // answer. Resolve it against the options we actually offered before any
  // parsing runs, otherwise the digit reads as a budget.
  const pending = existing?.pending;
  let message = input.message;
  const asDigit = Number(message.trim());
  if (
    pending &&
    Number.isInteger(asDigit) &&
    asDigit >= 1 &&
    asDigit <= pending.options.length
  ) {
    message = pending.options[asDigit - 1];
  }

  const extracted = extractRequirements(message);
  let requirements = mergeRequirements(
    existing?.requirements ?? {},
    extracted,
    isCorrection(message),
  );

  // "Any", "you suggest", "no preference" is a real answer. Treating it as
  // silence is what turns a conversation back into a form.
  if (pending && saysNoPreference(message)) {
    requirements = skip(requirements, pending.key);
  }

  // If a question has already been put once and still has no answer, move on
  // rather than repeat it. Repetition is the single thing that makes a bot
  // feel broken.
  if (
    pending &&
    requirements[pending.key as keyof LeadRequirements] === undefined &&
    !(requirements.skipped ?? []).includes(pending.key) &&
    pending.asks >= 1
  ) {
    requirements = skip(requirements, pending.key);
  }

  const availability = extractAvailability(message);
  if (availability && !requirements.preferredTime) {
    requirements = { ...requirements, preferredTime: availability };
  }

  // Sticky, like a viewing: the request survives the turn where the time
  // is given, so the reply confirms rather than resuming the questionnaire.
  const callRequested = (existing?.callRequested ?? false) || wantsCall(message);
  const viewingRequested =
    (existing?.viewingRequested ?? false) || wantsViewing(message);
  const { score, temperature, breakdown } = scoreLead(requirements);

  // Recommend only once there is enough to match on honestly.
  const hasEnough =
    requirements.intent !== undefined &&
    (requirements.budgetMax !== undefined || requirements.community !== undefined);
  const recommended = hasEnough ? recommendProperties(requirements) : [];

  // Reply, in priority order: small talk, a direct answer, a viewing request,
  // recommendations, then the next qualification question. Each branch is
  // written to sound like a person rather than a form.
  const firstName = AGENT_NAME.split(" ")[0];
  const seed = input.visitorId;
  // Salted with the turn number: without this every bridge line in a
  // conversation is identical, which is exactly what makes a bot sound
  // like a bot.
  const turnSeed = `${input.visitorId}:${existing?.conversation.length ?? 0}`;
  const knowledge = answerFromKnowledge(message);
  const question = nextQuestion(requirements);
  const smallTalk = detectSmallTalk(message);
  const answeredCount = QUESTIONS.filter((q) => requirements[q.key] !== undefined).length;

  // Only acknowledge facts that arrived in *this* message — repeating things
  // said three turns ago reads like a machine reciting a file back.
  const ack = Object.keys(extracted).length > 0 ? acknowledge(extracted, seed) : null;

  let reply: string;
  let quickReplies: string[] = [];
  // Set when the reply is asking for a time, so the options are attributed to
  // scheduling rather than to whatever question happened to be next.
  let askedSchedule = false;

  if (smallTalk && Object.keys(extracted).length === 0) {
    const opener = smallTalkReply(smallTalk, seed, firstName, Boolean(existing));
    if (smallTalk === "goodbye" || smallTalk === "thanks") {
      reply = opener;
    } else if (question) {
      reply = `${opener} ${question.prompt}`;
    } else {
      reply = opener;
    }
  } else if (knowledge) {
    reply = knowledge;
    if (question) reply += `

${question.prompt}`;
  } else if (callRequested || (viewingRequested && hasEnough)) {
    if (requirements.preferredTime) {
      const verb = callRequested ? "call you" : "meet you";
      reply = `Done — ${firstName} will ${verb} ${requirements.preferredTime}.`;
    } else {
      reply = `Sure — when suits you?`;
      askedSchedule = true;
      quickReplies = [];
    }
  } else if (recommended.length > 0 && !question) {
    reply = `${ack ? ack + " " : ""}Here's what fits from ${firstName}'s current portfolio.`;
  } else if (question) {
    // The opener leads with what we actually have, so there is something to
    // react to rather than an interrogation.
    const greeting = existing
      ? ""
      : `Hi — ${firstName}'s assistant here. We cover off-plan, ready homes and investment property across Dubai. `;
    reply = ack ? `${ack} ${question.prompt}` : `${greeting}${question.prompt}`;
  } else if (recommended.length > 0) {
    reply = `${ack ? ack + " " : ""}These are the closest matches right now.`;
  } else {
    // Nothing in stock fits. Never a dead end, and never an invitation to
    // negotiate against ourselves — hand it to the advisor.
    reply = `${ack ? ack + " " : ""}Nothing in the current portfolio matches that exactly. ${firstName} will be in touch shortly — he often has stock before it's listed.`;
  }

  // Close by saying what happens next — but never after a booking reply, which
  // has already said what happens next.
  if (
    !smallTalk &&
    !question &&
    !callRequested &&
    !viewingRequested &&
    temperature !== "cold" &&
    recommended.length > 0
  ) {
    reply += ` ${handoffLine(firstName, temperature === "hot", seed)}`;
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
    callRequested,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  // Carry the question forward. `asks` is what lets the next turn decide to
  // move on rather than repeat.
  // Armed whenever a question is put, with or without options — otherwise
  // removing the option lists silently disabled the anti-repeat guard.
  const askedKey = askedSchedule
    ? "__schedule"
    : question
      ? question.key
      : undefined;
  const nextPending =
    askedKey !== undefined
      ? {
          key: String(askedKey),
          options: quickReplies,
          asks: pending?.key === String(askedKey) ? pending.asks + 1 : 0,
        }
      : quickReplies.length > 0
        ? { key: "__followup", options: quickReplies, asks: 0 }
        : undefined;

  const lead: Lead = {
    ...base,
    pending: nextPending,
    nextAction: deriveNextAction(base),
  };
  await saveLead(lead);

  return { reply, quickReplies, recommended: lead.recommended, lead };
}
