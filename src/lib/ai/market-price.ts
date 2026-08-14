import "server-only";
import {
  isResidentialType,
  parseAreaToSqft,
  type Property,
} from "@/lib/property-data";
import { generateText } from "@/lib/ai/json-model";

export interface MarketPriceEstimate {
  headline: string;
  detail: string;
  sources: { title: string; url: string }[];
}

export class MarketDataUnavailableError extends Error {
  constructor(message = "Live market data is unavailable right now.") {
    super(message);
    this.name = "MarketDataUnavailableError";
  }
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

/**
 * Retrieval is deliberately separated from reasoning.
 *
 * Tavily returns real, citable pages; Gemini only ever summarises text that
 * came back from that search, never its own recollection. Tavily also ships
 * its own one-line `answer`, which is not used here — on a live listing it
 * derived "AED 3,170 per sq ft" from "AED 3.17M for 40,000 sq ft", off by
 * roughly forty times. A price on a property page has to be reasoned from
 * the source text, not lifted from a convenience field.
 */
async function searchMarket(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new MarketDataUnavailableError("Market search is not configured.");

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 6,
      include_answer: false,
    }),
    signal: AbortSignal.timeout(25_000),
  }).catch(() => undefined);

  if (!response?.ok) {
    throw new MarketDataUnavailableError(
      response?.status === 401 || response?.status === 432
        ? "The market search key was rejected or is out of credit."
        : "Market search could not be reached.",
    );
  }

  const payload = (await response.json()) as { results?: TavilyResult[] };
  const results = (payload.results ?? []).filter(
    (item) => item?.title && item?.url && item?.content,
  );
  if (results.length === 0) throw new MarketDataUnavailableError();
  return results;
}

/**
 * Agent shorthand that belongs on a listing card but not in a search query.
 *
 * A listing titled "Selling under OP, Club Place, Dubai Hills 1BED Aprt"
 * searched on its own title and came back with sales-training articles —
 * "How To Sell Anything: 10 Methods for Sales Success" — which were then shown
 * to buyers as the sources behind the estimate.
 */
const AGENT_SHORTHAND =
  /\b(?:selling|sale|resale|under\s+op|below\s+op|op|distress(?:ed)?|urgent|hot\s+deal|direct\s+from\s+owner|motivated\s+seller|aprt|apt|bhk|br|bed)\b/gi;

function searchableSubject(title: string) {
  const cleaned = title
    // Whole bed-count tokens go first, so "1BED" is removed entirely rather
    // than leaving a stray "BED" behind for the search to trip over.
    .replace(/\b\d+\s*(?:bed(?:room)?s?|bhk|br)\b/gi, " ")
    .replace(AGENT_SHORTHAND, " ")
    .replace(/[,|/]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Never return nothing — a title that is entirely shorthand still has to
  // search for something.
  return cleaned.length >= 4 ? cleaned : title;
}

/**
 * A source is only worth showing a buyer if it is plausibly about Dubai
 * property. Anything else is noise that undermines the whole panel.
 */
function isAboutDubaiProperty(item: TavilyResult, community: string) {
  const haystack = `${item.title} ${item.content}`.toLowerCase();
  const place = community.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
  return (
    /\bdubai\b|\buae\b|\baed\b|\bsq\.?\s?ft\b|per\s*sqft/i.test(haystack) ||
    place.some((token) => haystack.includes(token))
  );
}

const PROMPT = `You are a Dubai real-estate analyst. Below are extracts from
real web pages about a property. Using ONLY those extracts, give an indicative
market price.

Reply in exactly two lines, nothing else:
Line 1: the indicative price or price range only, e.g.
  "AED 1.9M - 2.3M" or "AED 1,750 - 2,100 per sq ft"
Line 2: one sentence (max 24 words) on what that is based on.

Rules:
- Use only figures that appear in the extracts. Never introduce your own.
- Price ONLY units comparable to the one described under PROPERTY. Sources
  mix whole-floor, multi-unit and single-unit prices for the same building.
  Ignore any figure whose size or unit count clearly does not match — a
  full-floor or entire-building price must never widen the range.
- Check the arithmetic of any per-sq-ft figure you quote; sources often
  state it wrongly. If a stated rate contradicts the price and size given,
  trust the price and size.
- Prefer a range over a single number, but keep it tight — if the
  comparable figures cluster, say so rather than spanning every outlier.
- If the extracts only cover units of a different size, make line 1 exactly
  "Not enough public data" and say in line 2 what the sources did cover.
- If the extracts do not contain enough to answer, make line 1 exactly
  "Not enough public data" and use line 2 to say what to ask the agent for.`;

export async function estimateMarketPrice(
  property: Property,
): Promise<MarketPriceEstimate> {
  const community = property.community ?? property.location;
  const areaSqft = parseAreaToSqft(property.area);

  // Naming the actual unit keeps the search on comparable stock. Querying the
  // building alone returned whole-floor listings alongside single suites and
  // produced a range spanning "AED 19M - 90M", which tells a buyer nothing.
  const unitDescriptor = [
    isResidentialType(property.type) && property.bedrooms > 0
      ? `${property.bedrooms} bedroom`
      : undefined,
    property.type.toLowerCase(),
    areaSqft > 0 ? `${areaSqft.toLocaleString("en-US")} sq ft` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  const results = await searchMarket(
    `${searchableSubject(property.title)} ${community} Dubai ${unitDescriptor} asking price AED per sqft`,
  );

  // Showing an irrelevant source is worse than showing none: it tells a buyer
  // the estimate was drawn from something that has nothing to do with the
  // property. With none left the model reports "Not enough public data".
  const relevant = results.filter((item) => isAboutDubaiProperty(item, community));

  const extracts = relevant
    .map((item, index) => `[${index + 1}] ${item.title}\n${item.content.slice(0, 1200)}`)
    .join("\n\n");

  const answer = await generateText({
    prompt: `${PROMPT}

PROPERTY
Name: ${property.title}
Community: ${community}, ${property.emirate ?? "Dubai"}
Type: ${property.type}
Unit: ${unitDescriptor}
Size: ${property.area}${areaSqft > 0 ? ` (about ${areaSqft.toLocaleString("en-US")} sq ft)` : ""}
Listed at: ${property.price}
Price figures for units of a materially different size are not comparable.

EXTRACTS
${extracts}`,
  }).catch(() => {
    // Retries and a second model are already exhausted by this point.
    throw new MarketDataUnavailableError();
  });

  const lines = (answer ?? "")
    .split("\n")
    .map((line) => line.replace(/^\s*(?:line\s*\d\s*[:.]?|[-*])\s*/i, "").trim())
    .filter(Boolean);
  if (lines.length === 0) throw new MarketDataUnavailableError();

  return {
    headline: lines[0].slice(0, 90),
    detail: (lines[1] ?? "").slice(0, 220),
    sources: relevant.slice(0, 3).map((item) => ({
      title: item.title.slice(0, 80),
      url: item.url,
    })),
  };
}
