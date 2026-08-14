import { parsePriceToAed, type Property } from "@/lib/property-data";

/** Dubai Land Department transfer fee — standard rate, paid at title transfer. */
const DLD_TRANSFER_FEE_RATE = 0.04;

export function calculateDldFee(price: string): number {
  return Math.round(parsePriceToAed(price) * DLD_TRANSFER_FEE_RATE);
}

/**
 * Approximate — the UAE Golden Visa real-estate threshold is government
 * policy, not a fixed constant, so this is deliberately phrased as
 * "may qualify" rather than a guarantee anywhere it's shown.
 */
const GOLDEN_VISA_APPROX_THRESHOLD_AED = 2_000_000;

export function isGoldenVisaEligible(price: string): boolean {
  return parsePriceToAed(price) >= GOLDEN_VISA_APPROX_THRESHOLD_AED;
}

export function formatAedCompact(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `AED ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(2)}M`;
  }
  if (value >= 1_000) return `AED ${Math.round(value / 1_000)}K`;
  return `AED ${Math.round(value)}`;
}

export function formatAedFull(value: number): string {
  return `AED ${Math.round(value).toLocaleString("en-US")}`;
}

export interface DubaiFacts {
  dldFeeAed: number;
  dldFeeLabel: string;
  goldenVisaEligible: boolean;
  permitLabel: string;
  permitIsPlaceholder: boolean;
}

export function buildDubaiFacts(property: Property): DubaiFacts {
  const dldFeeAed = calculateDldFee(property.price);
  const permitIsPlaceholder =
    !property.permitNumber ||
    property.permitNumber === "Demo inventory" ||
    property.permitNumber === "Pending verification";

  return {
    dldFeeAed,
    dldFeeLabel: formatAedFull(dldFeeAed),
    goldenVisaEligible: isGoldenVisaEligible(property.price),
    permitLabel: permitIsPlaceholder
      ? "Pending verification"
      : property.permitNumber!,
    permitIsPlaceholder,
  };
}
