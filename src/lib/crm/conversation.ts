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
          `Hey, good ${partOfDay()}! ${agentFirstName}'s assistant here.`,
          `Hi, good ${partOfDay()} — ${agentFirstName}'s assistant here.`,
          `Hello! ${agentFirstName}'s assistant here in Dubai.`,
        ],
        seed,
      );

    case "how_are_you":
      return pick(
        [
          `Doing well, thanks — busy season in Dubai.`,
          `All good here, thanks. Plenty moving at the moment.`,
          `Very well, thanks for asking.`,
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
          `Take care — message anytime, I'll remember where we got to.`,
          `Speak soon. Everything's saved, so no need to start over.`,
        ],
        seed,
        17,
      );

    case "who_are_you":
      return `I'm ${agentFirstName}'s assistant — I take the first few details so he can pick it up properly. Everything goes straight to him.`;

    case "human":
      return `Of course — ${agentFirstName} will call you himself. When suits you?`;
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
      "Dubai Marina": "strong rental demand there",
      "Emaar Beachfront": "beachfront, holds value well",
      "Palm Jumeirah": "limited supply, always in demand",
      "Dubai Creek Harbour": "lots of new launches there",
      "Downtown Dubai": "strong short-let numbers",
      "Business Bay": "good yields, priced under Downtown",
      "Jumeirah Village Circle": "good entry point",
      "Damac Hills": "family territory, more space",
      "Arabian Ranches": "villa community, family favourite",
      "Dubai Hills Estate": "strong family community",
    };
    const note = notes[incoming.community];
    bits.push(note ? `${incoming.community} — ${note}.` : `${incoming.community}, noted.`);
  }

  const budget = incoming.budgetMax ?? incoming.budgetMin;
  if (budget) {
    const m = budget / 1_000_000;
    if (budget >= 5_000_000) bits.push(`AED ${m.toFixed(1)}M — that's the prime end, plenty of choice.`);
    else if (budget >= 2_000_000) bits.push(`AED ${m.toFixed(1)}M works in most good areas.`);
    else if (budget >= 1_000_000) bits.push(`AED ${m.toFixed(2)}M gives a decent range, especially off-plan.`);
    else bits.push(`Noted.`);
  }

  if (incoming.payment === "cash") {
    bits.push(pick([`Cash helps on price.`, `Cash puts you in a stronger position.`], seed, 3));
  } else if (incoming.payment === "mortgage") {
    bits.push(`Mortgage is straightforward here.`);
  }

  if (incoming.timeline === "immediate" || incoming.timeline === "within_1_month") {
    bits.push(`Moving quickly, understood.`);
  }

  if (incoming.purpose === "investment" && !incoming.community) {
    bits.push(`Investment focus, noted.`);
  }

  if (bits.length === 0) return null;
  // Two facts is a natural amount to reflect back; more reads like a receipt.
  return bits.slice(0, 1).join(" ");
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
        `I've flagged this to ${agentFirstName} — he'll come back to you today.`,
        `${agentFirstName} will pick this up personally, usually within the day.`,
      ],
      seed,
      31,
    );
  }
  return pick(
    [
      `I'll pass this to ${agentFirstName}.`,
      `${agentFirstName} will come back with options.`,
    ],
    seed,
    37,
  );
}
