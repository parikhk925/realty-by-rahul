import {
  parseAreaToSqft,
  parsePriceToAed,
  getProjectCategory,
  type Property,
} from "@/lib/property-data";

export interface PriceContext {
  pricePerSqft?: number;
  areaSqft?: number;
  priceAed?: number;
  /** Comparable live listings in the same community, this one excluded. */
  communityName?: string;
  communityAverage?: number;
  communityCount: number;
  /** How this listing sits against that average, as a signed percentage. */
  differencePercent?: number;
  portfolioLow?: number;
  portfolioHigh?: number;
  portfolioCount: number;
}

function pricePerSqft(property: Property) {
  const price = parsePriceToAed(property.price);
  const area = parseAreaToSqft(property.area);
  if (price <= 0 || area <= 0) return undefined;
  return price / area;
}

/**
 * Everything here is arithmetic on listings the agency actually owns — no
 * model, no external feed, no cost. A buyer can check every number against
 * the listings themselves, which is the whole point: a price figure on a
 * property page has to be something we can stand behind, not an estimate
 * dressed up as data.
 */
export function buildPriceContext(
  property: Property,
  candidates: Property[],
): PriceContext {
  const rate = pricePerSqft(property);
  const area = parseAreaToSqft(property.area);
  const price = parsePriceToAed(property.price);
  const category = getProjectCategory(property);
  const community = (property.community ?? property.location).trim().toLowerCase();

  // Only compare like with like: a rental yearly figure and a sale price are
  // not the same unit, and mixing them would produce a meaningless average.
  const comparable = candidates
    .filter(
      (item) =>
        item.slug !== property.slug &&
        item.status === "Live" &&
        getProjectCategory(item) === category,
    )
    .map((item) => ({ item, rate: pricePerSqft(item) }))
    .filter((entry): entry is { item: Property; rate: number } =>
      entry.rate !== undefined,
    );

  const inCommunity = comparable.filter(
    (entry) =>
      (entry.item.community ?? entry.item.location).trim().toLowerCase() ===
      community,
  );

  const communityAverage =
    inCommunity.length > 0
      ? inCommunity.reduce((sum, entry) => sum + entry.rate, 0) / inCommunity.length
      : undefined;

  const allRates = comparable.map((entry) => entry.rate);

  return {
    pricePerSqft: rate,
    areaSqft: area > 0 ? area : undefined,
    priceAed: price > 0 ? price : undefined,
    communityName: property.community ?? property.location,
    communityAverage,
    communityCount: inCommunity.length,
    differencePercent:
      rate !== undefined && communityAverage !== undefined && communityAverage > 0
        ? ((rate - communityAverage) / communityAverage) * 100
        : undefined,
    portfolioLow: allRates.length > 0 ? Math.min(...allRates) : undefined,
    portfolioHigh: allRates.length > 0 ? Math.max(...allRates) : undefined,
    portfolioCount: allRates.length,
  };
}
