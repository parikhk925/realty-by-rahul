import type { LeadRequirements } from "./types";

/**
 * The voice layer.
 *
 * The engine decides *what* to say; this decides *how* it sounds. Kept
 * separate so the qualification logic stays testable and the wording can
 * change without touching scoring or matching.
 *
 * Everything here is deterministic: phrasing is picked by a hash of the
 * visitor id, so a given lead gets a consistent voice across a conversation
 * and tests stay reproducible.
 */

export type SmallTalk =
  | "greeting"
  | "how_are_you"
  | "thanks"
  | "goodbye"
  | "who_are_you"
  | "human"
  | null;

/** Stable index into a phrasing pool, so one lead never sees the same line twice running. */
function pick<T>(pool: T[], seed: string, salt = 0): T {
  let hash = salt;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}

export function detectSmallTalk(message: string): SmallTalk {
  const t = message.trim().toLowerCase().replace(/[!.?]+$/, "");

  if (/^(hi|hey|hello|yo|hiya|helo|hii+|salam|salaam|assalam[ou]?\s?alaikum|namaste|good (morning|afternoon|evening))\b/.test(t))
    return "greeting";
  if (/how (are|r) (you|u)|how'?s it going|how are things|kaise ho|how do you do/.test(t))
    return "how_are_you";
  if (/^(thanks|thank you|thx|ty|shukran|appreciate it|great|perfect|awesome|nice)\b/.test(t))
    return "thanks";
  if (/^(bye|goodbye|see you|later|cya|ok bye|talk later)\b/.test(t)) return "goodbye";
  if (/who (are|r) (you|u)|are you (a )?(bot|human|real)|is this rahul|am i talking to/.test(t))
    return "who_are_you";
  if (/talk to (a )?(human|person|agent|rahul)|speak to rahul|call me|real person/.test(t))
    return "human";

  return null;
}

/** Time-of-day greeting in Gulf Standard Time, since that is where the buyer is. */
function partOfDay(): "morning" | "afternoon" | "evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Dubai",
    }).format(new Date()),
  );
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function smallTalkReply(
  kind: Exclude<SmallTalk, null>,
  seed: string,
  agentFirstName: string,
  isReturning: boolean,
): string {
  switch (kind) {
    case "greeting":
      if (isReturning) {
        return pick(
          [
            `Welcome back! Good to hear from you again.`,
            `Hey again — good to hear from you.`,
            `Good ${partOfDay()}, welcome back.`,
          ],
          seed,
        );
      }
      return pick(
        [
          `Hey, good ${partOfDay()}! I'm ${agentFirstName}'s assistant — I help buyers and investors find the right property in Dubai.`,
          `Hi there, good ${partOfDay()}! I work with ${agentFirstName} on the Dubai side — off-plan, ready homes and investment stock.`,
          `Hello! Good ${partOfDay()}. I'm ${agentFirstName}'s assistant here in Dubai — happy to help you find something that actually fits.`,
        ],
        seed,
      );

    case "how_are_you":
      return pick(
        [
          `Doing well, thank you for asking! Dubai's been busy — plenty moving in the off-plan market right now.`,
          `All good here, thanks! It's an active season in Dubai, lots of new launches coming through.`,
          `Very well, thanks for asking. Busy few weeks — the market hasn't slowed down at all.`,
        ],
        seed,
        7,
      );

    case "thanks":
      return pick(
        [`Happy to help.`, `Anytime.`, `My pleasure.`], seed, 13);

    case "goodbye":
      return pick(
        [
          `Take care! I'll keep your requirements on file — message anytime and we'll pick up where we left off.`,
          `Speak soon. Everything you've told me is saved, so there's no need to start over next time.`,
        ],
        seed,
        17,
      );

    case "who_are_you":
      return `I'm ${agentFirstName}'s assistant — I handle the first conversation so he can focus on the buyers who are ready to move. Everything you tell me goes straight to him, and he picks it up personally from there.`;

    case "human":
      return `Of course — ${agentFirstName} will pick this up himself. So he can come back to you properly prepared, can I take a couple of quick details first?`;
  }
}

/**
 * A short, specific acknowledgement of what the lead just told us.
 *
 * This is what stops the bot reading like a form: it repeats back the thing
 * that matters and adds one piece of local knowledge before moving on.
 */
export function acknowledge(
  incoming: LeadRequirements,
  seed: string,
): string | null {
  const bits: string[] = [];

  if (incoming.community) {
    const notes: Record<string, string> = {
      "Dubai Marina": "one of the most liquid rental markets in the city",
      "Emaar Beachfront": "beachfront stock, and it holds value well",
      "Palm Jumeirah": "always in demand, and supply is genuinely limited",
      "Dubai Creek Harbour": "a lot of the new launches are concentrated there",
      "Downtown Dubai": "strong short-let numbers around the Boulevard",
      "Business Bay": "good yields, and it's still priced under Downtown",
      "Jumeirah Village Circle": "the best entry point if you're starting a portfolio",
      "Damac Hills": "family territory — quieter, more space for the money",
      "Arabian Ranches": "villa community, popular with families settling long term",
      "Dubai Hills Estate": "one of the strongest family communities right now",
    };
    const note = notes[incoming.community];
    bits.push(note ? `${incoming.community} — ${note}.` : `${incoming.community}, noted.`);
  }

  const budget = incoming.budgetMax ?? incoming.budgetMin;
  if (budget) {
    const m = budget / 1_000_000;
    if (budget >= 5_000_000) bits.push(`At AED ${m.toFixed(1)}M you're into the prime end, so you'll have real choice.`);
    else if (budget >= 2_000_000) bits.push(`AED ${m.toFixed(1)}M is a workable budget in most of the good communities.`);
    else if (budget >= 1_000_000) bits.push(`AED ${m.toFixed(2)}M opens up a decent range, especially off-plan.`);
    else bits.push(`Noted on budget.`);
  }

  if (incoming.payment === "cash") {
    bits.push(pick(
      [`Cash puts you in a stronger position on price.`, `Cash buyers get taken seriously here — that helps.`],
      seed, 3,
    ));
  } else if (incoming.payment === "mortgage") {
    bits.push(`Mortgage is straightforward here — Rahul can introduce an independent broker when you're ready.`);
  }

  if (incoming.timeline === "immediate" || incoming.timeline === "within_1_month") {
    bits.push(`And you're moving quickly, understood.`);
  }

  if (incoming.purpose === "investment" && !incoming.community) {
    bits.push(`Investment focus, noted — that changes which communities I'd point you at.`);
  }

  if (bits.length === 0) return null;
  // Two facts is a natural amount to reflect back; more reads like a receipt.
  return bits.slice(0, 2).join(" ");
}

/** Softens the jump from acknowledgement into the next question. */
export function bridgeToQuestion(seed: string, isFirstQuestion: boolean): string {
  if (isFirstQuestion) {
    return pick(
      [
        `To point you at the right things —`,
        `So I can narrow it down —`,
        `Let me start with the basics —`,
        `First things first —`,
        `To get you to the right stock —`,
      ],
      seed,
      23,
    );
  }
  return pick(
    [
      `Next —`,
      `One more —`,
      `Quick one —`,
      `Got it. Now —`,
      `Right —`,
      `Helpful. Next —`,
    ],
    seed,
    29,
  );
}

/** Closing line once there is enough to hand over. */
export function handoffLine(agentFirstName: string, isHot: boolean, seed: string): string {
  if (isHot) {
    return pick(
      [
        `I've flagged this to ${agentFirstName} as a priority — he'll come back to you personally, usually within the day.`,
        `${agentFirstName} will pick this up himself shortly; I've marked it urgent on his side.`,
      ],
      seed,
      31,
    );
  }
  return pick(
    [
      `I'll pass this to ${agentFirstName} — he'll follow up with anything that fits.`,
      `${agentFirstName} will review this and come back with options.`,
    ],
    seed,
    37,
  );
}
