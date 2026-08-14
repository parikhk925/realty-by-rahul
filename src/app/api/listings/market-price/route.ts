import { unstable_cache } from "next/cache";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import {
  estimateMarketPrice,
  MarketDataUnavailableError,
} from "@/lib/ai/market-price";
import { getPublishedProperty } from "@/lib/published-properties";

export const maxDuration = 60;

/**
 * Public, because the button sits on the buyer-facing listing page. Each click
 * would otherwise spend a search credit and a model call, so results are held
 * for a day per listing — the market does not move fast enough for a fresher
 * figure to be worth it, and a shared link cannot run up the bill.
 */
const cachedEstimate = (slug: string) =>
  unstable_cache(
    async () => {
      const published = await getPublishedProperty(slug);
      const property = published?.property;
      if (!property || property.status !== "Live") return undefined;
      return estimateMarketPrice(property);
    },
    ["market-price", slug],
    { revalidate: 60 * 60 * 24, tags: [`market-price-${slug}`] },
  )();

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) {
    return Response.json({ error: "Missing listing." }, { status: 400 });
  }
  if (!isGeminiConfigured() || !process.env.TAVILY_API_KEY) {
    return Response.json(
      { error: "Market data isn't configured on this deployment yet." },
      { status: 503 },
    );
  }

  try {
    // Checked outside the cache: a draft that gets published should work
    // immediately, not after the estimate's 24 hour window has rolled over.
    const property = (await getPublishedProperty(slug))?.property;
    if (!property) {
      return Response.json(
        {
          error:
            "This listing has not been published yet, so there is nothing to compare. Save and publish it, then try again.",
        },
        { status: 404 },
      );
    }
    if (property.status !== "Live") {
      return Response.json(
        {
          error:
            "This listing is still a draft. Set it Live to compare it against the market.",
        },
        { status: 409 },
      );
    }

    const estimate = await cachedEstimate(slug);
    if (!estimate) {
      return Response.json(
        { error: "No market estimate could be prepared for this listing." },
        { status: 404 },
      );
    }
    return Response.json(estimate);
  } catch (error) {
    if (error instanceof MarketDataUnavailableError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    return Response.json(
      { error: "The market estimate could not be prepared right now." },
      { status: 502 },
    );
  }
}
