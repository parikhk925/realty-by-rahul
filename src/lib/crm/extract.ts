import type { LeadRequirements } from "./types";

/**
 * Deterministic requirement extraction from free text.
 *
 * Rules rather than a language model: budgets and bedroom counts are parsed
 * far more reliably this way, and the result is reproducible in tests.
 */

const COMMUNITIES = [
  "Emaar Beachfront",
  "Dubai Creek Harbour",
  "Dubai Marina",
  "Downtown Dubai",
  "Business Bay",
  "Palm Jumeirah",
  "Jumeirah Village Circle",
  "Damac Hills",
  "Arabian Ranches",
  "Dubai Hills Estate",
  "Jumeirah Beach Residence",
  "Dubai South",
];

const COMMUNITY_ALIASES: Record<string, string> = {
  jvc: "Jumeirah Village Circle",
  jbr: "Jumeirah Beach Residence",
  marina: "Dubai Marina",
  downtown: "Downtown Dubai",
  palm: "Palm Jumeirah",
  creek: "Dubai Creek Harbour",
  "business bay": "Business Bay",
  beachfront: "Emaar Beachfront",
  "damac hills": "Damac Hills",
  "dubai hills": "Dubai Hills Estate",
};

const TYPES = [
  "Apartment",
  "Villa",
  "Townhouse",
  "Penthouse",
  "Office",
  "Retail",
  "Warehouse",
  "Plot",
];

/** "2.5m", "AED 3 million", "1,600,000", "800k" → number of AED. */
function parseAmount(raw: string): number | undefined {
  const m = raw.match(
    /(?:aed\s*)?([\d,]+(?:\.\d+)?)\s*(m\b|mn\b|million|k\b|thousand)?/i,
  );
  if (!m) return undefined;
  const value = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(value)) return undefined;
  const unit = (m[2] ?? "").toLowerCase();
  if (unit.startsWith("m")) return value * 1_000_000;
  if (unit.startsWith("k") || unit.startsWith("t")) return value * 1_000;
  return value;
}

export function extractRequirements(message: string): LeadRequirements {
  const text = message.toLowerCase();
  const out: LeadRequirements = {};

  // Intent
  if (/\bsell(ing)?\b|\blist my\b/.test(text)) out.intent = "sell";
  else if (/\brent(al|ing)?\b|\blease\b|\btenant\b/.test(text)) out.intent = "rent";
  else if (/\binvest(ment|or|ing)?\b|\broi\b|\byield\b|\brental return\b/.test(text))
    out.intent = "invest";
  else if (/\bbuy(ing)?\b|\bpurchase\b|\bown\b/.test(text)) out.intent = "buy";

  // Purpose
  if (/\binvest(ment|or|ing)?\b|\broi\b|\byield\b/.test(text)) out.purpose = "investment";
  else if (/\blive in\b|\bend use\b|\bmove in\b|\bfamily\b|\bmyself\b/.test(text))
    out.purpose = "end_use";

  // Budget — range first, then single figure
  const range = text.match(
    /(?:between\s*)?((?:aed\s*)?[\d,.]+\s*(?:m|mn|million|k|thousand)?)\s*(?:-|–|to|and)\s*((?:aed\s*)?[\d,.]+\s*(?:m|mn|million|k|thousand)?)/i,
  );
  if (range) {
    const a = parseAmount(range[1]);
    const b = parseAmount(range[2]);
    if (a && b) {
      out.budgetMin = Math.min(a, b);
      out.budgetMax = Math.max(a, b);
    }
  } else {
    const single = text.match(
      /(?:budget|around|about|upto|up to|under|max(?:imum)?|below|aed)\s*((?:aed\s*)?[\d,.]+\s*(?:m|mn|million|k|thousand)?)/i,
    );
    let amount = single ? parseAmount(single[1]) : undefined;

    // A bare figure is the most natural answer to "what budget?" — "3.5M",
    // "2 million", "850k". Only accepted with an explicit magnitude, or as a
    // large plain number, and never when the number is measuring something
    // else (bedrooms, area, yield, timeline).
    if (!amount) {
      const bare = text.match(
        /(?<![\w.])([\d,]+(?:\.\d+)?)\s*(m|mn|million|k|thousand)?(?!\s*(?:bed|bedroom|br|bhk|sq|sqft|%|day|week|month|year))/i,
      );
      if (bare) {
        const candidate = parseAmount(`${bare[1]}${bare[2] ? " " + bare[2] : ""}`);
        const hasUnit = Boolean(bare[2]);
        if (candidate && ((hasUnit && candidate >= 50_000) || candidate >= 100_000)) {
          amount = candidate;
        }
      }
    }

    if (amount && amount >= 10_000) out.budgetMax = amount;
  }

  // Bedrooms
  if (/\bstudio\b/.test(text)) out.bedrooms = 0;
  else {
    // Plural matters: "2 bedrooms" is far more common than "2 bedroom", and
    // requiring a boundary straight after "bedroom" silently dropped it.
    const bed = text.match(/(\d)\s*(?:-|\s)?\s*(?:beds?|bedrooms?|br|bhk)\b/);
    if (bed) out.bedrooms = Number(bed[1]);
  }

  // Community
  for (const community of COMMUNITIES) {
    if (text.includes(community.toLowerCase())) {
      out.community = community;
      break;
    }
  }
  if (!out.community) {
    for (const [alias, community] of Object.entries(COMMUNITY_ALIASES)) {
      if (new RegExp(`\\b${alias}\\b`).test(text)) {
        out.community = community;
        break;
      }
    }
  }

  // Property type
  for (const type of TYPES) {
    if (new RegExp(`\\b${type.toLowerCase()}s?\\b`).test(text)) {
      out.propertyType = type;
      break;
    }
  }

  // Off-plan vs ready
  if (/\boff[- ]?plan\b|\bunder construction\b|\blaunch\b/.test(text))
    out.marketType = "off_plan";
  else if (/\bready\b|\bhanded over\b|\bmove[- ]in\b|\bsecondary\b|\bresale\b/.test(text))
    out.marketType = "ready";

  // Timeline
  if (/\bimmediate(ly)?\b|\bright away\b|\basap\b|\bthis week\b/.test(text))
    out.timeline = "immediate";
  else if (/\b(within|in)\s*(a|1|one)\s*month\b|\b30 days\b/.test(text))
    out.timeline = "within_1_month";
  else if (/\b(2|3|two|three)\s*months?\b|\bquarter\b/.test(text))
    out.timeline = "within_3_months";
  else if (/\b(4|5|6|four|five|six)\s*months?\b/.test(text))
    out.timeline = "within_6_months";
  else if (/\bjust (looking|exploring|browsing)\b|\bresearch(ing)?\b|\bno rush\b/.test(text))
    out.timeline = "just_exploring";

  // Payment
  if (/\bcash\b|\bfull payment\b/.test(text)) out.payment = "cash";
  else if (/\bmortgage\b|\bfinanc(e|ing)\b|\bloan\b|\bpre[- ]?approved\b/.test(text))
    out.payment = "mortgage";

  // Nationality / residency
  const nat = text.match(
    /\b(indian|british|uk|pakistani|russian|chinese|german|french|emirati|uae resident|non[- ]resident|expat)\b/,
  );
  if (nat) out.nationality = nat[1];

  // Expected ROI
  const roi = text.match(/(\d{1,2}(?:\.\d)?)\s*%/);
  if (roi) out.expectedRoi = `${roi[1]}%`;

  // Intent is usually implied, not stated. "2 bed downtown 2 million" is a
  // buyer; requiring a verb like "want" meant those messages produced no
  // intent, and without an intent nothing is ever recommended.
  //
  // Rent, invest and sell are all detected explicitly above, so anything left
  // that describes a property is a purchase enquiry. Two signals are required
  // so a lone number or a bare area name does not trigger it.
  if (!out.intent) {
    const signals = [
      out.bedrooms !== undefined,
      out.propertyType !== undefined,
      out.community !== undefined,
      out.budgetMax !== undefined,
      // "off-plan" is as strong a purchase signal as a bedroom count.
      out.marketType !== undefined,
    ].filter(Boolean).length;

    const shopping =
      // `wanted?` would make the d optional and never match a plain "want".
      /looking for|look for|want(?:s|ed)?\b|needs?\b|searching|interested in|show me|find me|do you have|got any/i.test(
        text,
      );

    if (signals >= 2 || (signals >= 1 && shopping)) out.intent = "buy";
  }

  return out;
}

/** New values fill blanks; explicit corrections overwrite. */
export function mergeRequirements(
  current: LeadRequirements,
  incoming: LeadRequirements,
  isCorrection: boolean,
): LeadRequirements {
  const merged: LeadRequirements = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;
    const k = key as keyof LeadRequirements;
    if (isCorrection || merged[k] === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (merged as any)[k] = value;
    }
  }
  return merged;
}

export function isCorrection(message: string): boolean {
  return /\bactually\b|\binstead\b|\bnot\b .*\brather\b|\bchange\b|\bno,\s/i.test(message);
}


/**
 * "Any", "you pick", "no preference".
 *
 * A qualifier that cannot take this for an answer is just a form: it will
 * ask the same question until the person leaves.
 */
export function saysNoPreference(message: string): boolean {
  return /^(any\b|anything|any of (them|these)|any ?one|open\b|open to (suggestions|anything)|no preference|not fussed|flexible|whatever|does\s?n'?t matter|do\s?n'?t mind|you (suggest|decide|pick|choose|tell me)|your call|up to you|not sure|no idea|dunno|do\s?n'?t know|no specific|nothing specific|all good|either)/i.test(
    message.trim(),
  );
}

/** "today", "tomorrow", "this weekend", "Friday 3pm". */
export function extractAvailability(message: string): string | undefined {
  const t = message.trim();
  const day = t.match(
    /\b(today|tonight|tomorrow|this (week|weekend|evening|afternoon|morning)|next week|(?:mon|tues|wednes|thurs|fri|satur|sun)day|weekend)\b/i,
  );
  const time = t.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  if (day && time) return `${day[0]} at ${time[0]}`;
  if (day) return day[0];
  if (time) return time[0];
  return undefined;
}

/** A call is not a viewing; answering one with the other reads as broken. */
export function wantsCall(message: string): boolean {
  return /\bbook a call\b|\bcall me\b|\bphone call\b|\bschedule a call\b|\bspeak (to|with)\b|\btalk to\b|\bring me\b/i.test(
    message,
  );
}

export function wantsViewing(message: string): boolean {
  if (wantsCall(message)) return false;
  return /\bviewing\b|\bvisit\b|\bsee (it|the|this)\b|\btour\b|\bshow me around\b/i.test(
    message,
  );
}
