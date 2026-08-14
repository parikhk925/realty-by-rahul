import { properties as inventory, type Property } from "@/lib/property-data";
import type { LeadRequirements, RecommendedProperty } from "./types";

/**
 * Deterministic matching against the agency's own inventory.
 *
 * Nothing is ever invented: a listing is either in the portfolio and eligible,
 * or it is not recommended. Anything materially over budget is excluded
 * outright rather than shown as a stretch.
 */

function priceOf(property: Property): number {
  return Number(property.price.replace(/[^\d.]/g, "")) || 0;
}

function isRental(property: Property) {
  return property.purpose === "For Rent";
}

export function recommendProperties(
  requirements: LeadRequirements,
  limit = 3,
): RecommendedProperty[] {
  const wantsRental = requirements.intent === "rent";
  const budget = requirements.budgetMax ?? requirements.budgetMin;

  const eligible = inventory.filter((property) => {
    if (property.status !== "Live") return false;
    if (wantsRental !== isRental(property)) return false;
    if (budget) {
      const price = priceOf(property);
      // Never surface anything more than 15% above a stated budget.
      if (price > budget * 1.15) return false;
    }
    if (requirements.marketType === "off_plan" && property.constructionStatus !== "Off-plan")
      return false;
    if (requirements.marketType === "ready" && property.constructionStatus !== "Handed Over")
      return false;
    return true;
  });

  const scored = eligible.map((property) => {
    let points = 0;
    const reasons: string[] = [];
    const price = priceOf(property);

    if (budget && price <= budget) {
      points += 30;
      reasons.push("within budget");
    }
    if (requirements.community && property.community === requirements.community) {
      points += 25;
      reasons.push(`in ${property.community}`);
    }
    if (requirements.propertyType && property.type === requirements.propertyType) {
      points += 15;
      reasons.push("matches property type");
    }
    if (requirements.bedrooms !== undefined) {
      if (property.bedrooms === requirements.bedrooms) {
        points += 15;
        reasons.push("exact bedroom count");
      } else if (Math.abs(property.bedrooms - requirements.bedrooms) === 1) {
        points += 6;
      }
    }
    if (requirements.purpose === "investment" && property.expectedYield) {
      points += 10;
      reasons.push(`${property.expectedYield} expected yield`);
    }
    if (requirements.marketType && property.constructionStatus) {
      points += 5;
    }

    const matchPercentage = Math.max(35, Math.min(99, 40 + points));

    return {
      slug: property.slug,
      title: property.title,
      community: property.community ?? property.location,
      price: property.price,
      priceQualifier: property.priceQualifier,
      bedrooms: property.bedrooms,
      type: property.type,
      matchPercentage,
      reason: reasons.length
        ? `Recommended because it is ${reasons.slice(0, 3).join(", ")}.`
        : "Closest available option in the current portfolio.",
      expectedYield: property.expectedYield,
      paymentPlan: property.paymentPlan,
      handover: property.handover,
      image: property.images[0],
      _points: points,
    };
  });

  return scored
    .sort((a, b) => b._points - a._points)
    .slice(0, limit)
    .map(({ _points, ...rest }) => rest satisfies RecommendedProperty);
}

/** Honest explanation when nothing matches, instead of a fabricated result. */
export function diagnoseNoMatch(requirements: LeadRequirements): string {
  const budget = requirements.budgetMax ?? requirements.budgetMin;
  if (budget) {
    const cheapest = Math.min(
      ...inventory
        .filter((p) => (requirements.intent === "rent") === (p.purpose === "For Rent"))
        .map(priceOf)
        .filter((n) => n > 0),
    );
    if (Number.isFinite(cheapest) && budget * 1.15 < cheapest) {
      return `Nothing in the current portfolio sits within AED ${budget.toLocaleString("en-GB")}. The entry point right now is around AED ${cheapest.toLocaleString("en-GB")} — Rahul can flag new stock as it lands.`;
    }
  }
  if (requirements.community) {
    return `There's nothing available in ${requirements.community} matching that brief at the moment. Rahul will confirm what's coming and suggest nearby communities.`;
  }
  return "Nothing in the current portfolio matches that brief exactly. Rahul will review it personally and come back with options.";
}
