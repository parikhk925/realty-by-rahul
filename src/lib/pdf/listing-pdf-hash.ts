import { createHash } from "node:crypto";
import type { Property } from "@/lib/property-data";

/**
 * Only the fields that actually appear in the PDF feed the hash. `views`,
 * `enquiries` and `published` change independently of listing content and
 * must never force a regeneration, and the pdf* fields are excluded to avoid
 * self-referential drift.
 */
const HASHED_FIELDS: Array<keyof Property> = [
  "title",
  "location",
  "community",
  "emirate",
  "developer",
  "price",
  "priceQualifier",
  "originalPrice",
  "purpose",
  "type",
  "constructionStatus",
  "possessionMonth",
  "possessionYear",
  "bedrooms",
  "bathrooms",
  "area",
  "floor",
  "parking",
  "furnishing",
  "description",
  "highlights",
  "images",
  "paymentPlan",
  "paymentMilestones",
  "handover",
  "projectStage",
  "ownership",
  "expectedYield",
  "serviceCharge",
  "permitNumber",
  "reraVerified",
  "commissionCovered",
  "postHandoverPaymentPlan",
  "amenities",
  // The brochure is merged into the PDF, so swapping it has to force a
  // regeneration — without this the old combined file would stand forever.
  "brochure",
  "floorPlan",
];

/**
 * Bumped whenever the document's structure changes, not just its data.
 *
 * The hash is built from listing fields, so a change to the layout itself
 * matched the stored hash and generation was skipped — every listing kept
 * serving the previous build until someone happened to edit it. Splitting the
 * brochure out of the dossier changed nothing about the listing, so nothing
 * regenerated and buyers kept getting the merged file.
 */
const PDF_LAYOUT_VERSION = "7-msb-pocket-listings";

export function computeListingPdfHash(property: Property): string {
  // Built by iterating a fixed field order (not filtered via a JSON.stringify
  // replacer array, which would also strip keys out of nested objects like
  // paymentMilestones) — insertion order is therefore stable across calls.
  const canonical: Record<string, unknown> = { layout: PDF_LAYOUT_VERSION };
  for (const field of HASHED_FIELDS) {
    canonical[field] = property[field] ?? null;
  }
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
