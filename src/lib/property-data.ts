import { SEED_PROPERTIES } from "./seed-properties";

export type PropertyStatus = "Live" | "Draft";
export type PropertyPurpose = "For Sale" | "For Rent";
export type PropertyType =
  | "Apartment"
  | "Villa"
  | "Townhouse"
  | "Penthouse"
  | "Plot"
  | "Office"
  | "Retail"
  | "Warehouse";
export type ConstructionStatus = "Handed Over" | "Off-plan";
export type PossessionMonth =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";
export type ProjectCategory = "Off-plan" | "Secondary" | "Rent";

export const propertyTypes: PropertyType[] = [
  "Apartment",
  "Villa",
  "Townhouse",
  "Penthouse",
  "Plot",
  "Office",
  "Retail",
  "Warehouse",
];

export const possessionMonths: PossessionMonth[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface PaymentMilestone {
  label: string;
  percentage: number;
}

export interface PropertyPdf {
  name: string;
  url: string;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  location: string;
  locality: string;
  price: string;
  priceQualifier: string;
  /**
   * What the seller originally paid the developer ("OP"). Entered by the
   * agent, never inferred — it is knowledge the agency holds about the seller,
   * not something derivable from any public source.
   */
  originalPrice?: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  constructionStatus: ConstructionStatus;
  possessionMonth?: PossessionMonth;
  possessionYear?: number;
  bedrooms: number;
  bathrooms: number;
  area: string;
  floor: string;
  parking: string;
  furnishing: string;
  status: PropertyStatus;
  views: number;
  enquiries: number;
  published: string;
  description: string;
  highlights: string[];
  images: string[];
  developer?: string;
  emirate?: string;
  community?: string;
  paymentPlan?: string;
  paymentMilestones?: PaymentMilestone[];
  handover?: string;
  projectStage?: string;
  ownership?: "Freehold" | "Leasehold";
  expectedYield?: string;
  serviceCharge?: string;
  permitNumber?: string;
  reraVerified?: boolean;
  featured?: boolean;
  /** Dubai commission convention: whether the developer/seller covers the agent's fee. */
  commissionCovered?: boolean;
  /** Whether the developer offers a payment schedule extending past handover. */
  postHandoverPaymentPlan?: boolean;
  amenities?: string[];
  brochure?: PropertyPdf;
  floorPlan?: PropertyPdf;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentWhatsApp?: string;
  assignedAgentAvatarUrl?: string;
  /**
   * Auto-generated sales collateral — distinct from the manually uploaded
   * brochure/floorPlan above. Regenerated only when the listing's content
   * actually changes (see pdfContentHash), never on every download.
   */
  pdfUrl?: string;
  pdfGeneratedAt?: string;
  pdfContentHash?: string;
  pdfStatus?: "idle" | "generating" | "ready" | "failed";
}

const commercialTypes: PropertyType[] = ["Office", "Retail", "Warehouse", "Plot"];

/**
 * Bedroom and bathroom counts say nothing about commercial stock. An office
 * rendered as "Studio · 0 bathrooms" reads as broken data rather than as an
 * office, so these listings surface their type and parking instead.
 */
export function isResidentialType(type: PropertyType) {
  return !commercialTypes.includes(type);
}

/** Compact "2 bed" / "Office" label used on cards and rails. */
export function formatLayoutLabel(
  property: Pick<Property, "type" | "bedrooms">,
) {
  if (!isResidentialType(property.type)) return property.type;
  return property.bedrooms > 0 ? `${property.bedrooms} bed` : "Studio";
}

/**
 * What the download button should hand a buyer.
 *
 * The generated file now contains the developer's brochure in full, with the
 * unit's own terms and a location page appended, so it supersedes the raw
 * brochure rather than competing with it.
 *
 * It is only preferred once generation has finished. Generation runs after the
 * save returns, so between a Live save and that completing there is a window
 * where the stored file is missing or stale — the brochure covers it, and a
 * listing with no brochure at all still falls back to the generated dossier.
 */
/**
 * The developer's own brochure, exactly as they published it.
 *
 * Kept separate from the generated dossier: a buyer asking for "the brochure"
 * means the developer's document, and handing them ours with the developer's
 * pages folded in served neither well.
 */
export function getBrochureUrl(property: Pick<Property, "brochure">) {
  return property.brochure?.url;
}

/**
 * Our own dossier — the unit's terms, the floor plan and the location page.
 *
 * pdfUrl is keyed on the slug and overwritten in place, so the same address
 * always serves the newest build and its presence means a generated file
 * exists. The status is only consulted to rule out a known failure.
 */
export function getDossierUrl(
  property: Pick<Property, "pdfUrl" | "pdfStatus">,
) {
  if (!property.pdfUrl || property.pdfStatus === "failed") return undefined;
  return property.pdfUrl;
}

interface PropertyAvailability {
  purpose: PropertyPurpose;
  constructionStatus: ConstructionStatus;
  possessionMonth?: PossessionMonth;
  possessionYear?: number;
}

export function normalizePropertyAvailability<T extends PropertyAvailability>(
  value: T,
): T {
  if (value.purpose !== "For Rent") return value;
  return {
    ...value,
    constructionStatus: "Handed Over",
    possessionMonth: undefined,
    possessionYear: undefined,
  };
}

/**
 * Prices are free text ("AED 1.59M", "AED 145K / year", "AED 950,000"), so
 * resolve them to plain AED before comparing rather than trusting a suffix.
 */
export function parsePriceToAed(price: string): number {
  const value = Number.parseFloat(
    price.replace(/,/g, "").match(/[\d.]+/)?.[0] ?? "0",
  );
  if (!Number.isFinite(value)) return 0;
  // Matches formatPriceLabel: a bare figure under a thousand was typed in
  // millions. Reading it literally would put every per-sq-ft calculation a
  // millionfold out.
  if (/^[\d,.\s]+$/.test(price.trim()) && value < 1_000) {
    return value * 1_000_000;
  }
  if (/\dM\b/i.test(price.replace(/\s/g, ""))) return value * 1_000_000;
  if (/\dK\b/i.test(price.replace(/\s/g, ""))) return value * 1_000;
  return value;
}

/** Exact, not rounded — 1 sq ft is 0.09290304 sq m by definition. */
const SQM_PER_SQFT = 0.09290304;

/**
 * "745 sq ft" -> "745 sq ft (69.2 sq m)".
 *
 * Dubai quotes property in square feet, but buyers from most of the world
 * think in square metres, so the listing carries both rather than making
 * anyone convert.
 *
 * Left alone when the figure is already metric or has no number to read: the
 * field is free text, and appending a conversion to something that was never
 * square feet would state a size that is simply wrong.
 */
export function formatAreaWithSqm(area: string): string {
  if (/sq\.?\s?m|sqm|m²|square\s+met/i.test(area)) return area;
  // Listings saved before the field named its unit hold a bare "745", which
  // would otherwise read as "745 (69.2 sq m)" - a number with no unit sitting
  // beside one that has it. Labelling here fixes those on sight, no migration.
  const labelled = normalizeAreaInput(area);
  const sqft = parseAreaToSqft(labelled);
  if (sqft <= 0) return area;
  const sqm = sqft * SQM_PER_SQFT;
  return `${labelled} (${sqm.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })} sq m)`;
}

/**
 * The area field is free text so an agent can write "1,248 sq ft" or a plain
 * "1248". A bare number is taken as square feet — the Dubai convention, and
 * what the field asks for — so the unit is never lost on the way to storage.
 */
export function normalizeAreaInput(area: string): string {
  const trimmed = area.trim();
  if (!trimmed) return trimmed;
  return /^[\d,.\s]+$/.test(trimmed) ? `${trimmed.replace(/\s+/g, "")} sq ft` : trimmed;
}

/**
 * A price typed as a bare "1490444" reached the listing page exactly like
 * that, which reads as broken rather than as a price.
 *
 * Prices are free text so an agent can write "AED 1.59M" or "AED 145K / year".
 * Anything already carrying a currency or a suffix is left untouched - only a
 * plain number is given the currency and separators it was missing.
 */
export function formatPriceLabel(price: string): string {
  const trimmed = price.trim();
  if (!/^[\d,.\s]+$/.test(trimmed)) return price;
  const value = Number.parseFloat(trimmed.replace(/[,\s]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return price;
  // A bare figure under a thousand is millions. Nobody lists a Dubai property
  // at AED 6, so "6.2" typed into the price field means 6.2M - which is what
  // lets an agent type the number without also typing the M.
  const aed = value < 1_000 ? value * 1_000_000 : value;
  // Millions to match how the rest of the portfolio is written ("AED 1.59M",
  // "AED 6.2M"). Trailing zeros are dropped, so 2,000,000 is "AED 2M".
  if (aed >= 1_000_000) return `AED ${Number((aed / 1_000_000).toFixed(2))}M`;
  if (aed >= 1_000) return `AED ${Number((aed / 1_000).toFixed(1))}K`;
  return `AED ${aed.toLocaleString("en-US")}`;
}

/** Area is free text ("1,248 sq ft") — pull the plain number out for comparison. */
export function parseAreaToSqft(area: string): number {
  const value = Number.parseFloat(area.replace(/,/g, "").match(/[\d.]+/)?.[0] ?? "0");
  return Number.isFinite(value) ? value : 0;
}

export function getProjectCategory(property: Property): ProjectCategory {
  if (property.purpose === "For Rent") return "Rent";
  return property.constructionStatus === "Off-plan"
    ? "Off-plan"
    : "Secondary";
}

export interface PropertyCollection {
  id: string;
  slug: string;
  name: string;
  description: string;
  propertyIds: string[];
  status: "Published" | "Draft";
  /**
   * Stable token that keeps one curator's public link from colliding with
   * another's. The slug is the published file name, so without it two people
   * naming a collection the same thing overwrite each other's buyer link.
   */
  publicId?: string;
}

// Fallback inventory for a fresh install. Listings published through Supabase
// or Blob always take precedence over these — see getPublishedProperties.
export const properties = SEED_PROPERTIES as Property[];

export const collections: PropertyCollection[] = [];

export function getPropertyBySlug(slug: string) {
  return properties.find((property) => property.slug === slug);
}

export function getCollectionBySlug(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

/** The initials shown as the logo mark. */
export const BRAND_MARK = "RJ";
export const BRAND_NAME = "Realty by Rahul";
/** Empty by choice — the name stands alone, with no strapline beneath it. */
export const BRAND_TAGLINE = "";
/**
 * What a buyer sees and messages. Deliberately the brand rather than a
 * person's name, so enquiries read the same whichever advisor picks them up.
 */
export const AGENT_NAME = "Rahul Jakhar";
export const AGENT_WHATSAPP_NUMBER = "";
export const AGENT_WHATSAPP_DISPLAY = "";
export const AGENT_WHATSAPP_LINK = "https://wa.me/message/7MQC2TXBOY3YO1";
export const AGENT_INSTAGRAM_URL = "https://www.instagram.com/realtybyrahul.skyview";
export const publicAppUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://realty-by-rahul.vercel.app";

const propertyPurposes: PropertyPurpose[] = ["For Sale", "For Rent"];
const constructionStatuses: ConstructionStatus[] = [
  "Handed Over",
  "Off-plan",
];

function encodePreviewPayload(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodePreviewPayload(value: string) {
  if (!value || value.length > 50_000) return null;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return null;
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isProperty(value: unknown): value is Property {
  if (!value || typeof value !== "object") return false;
  const property = value as Partial<Property>;
  return (
    isString(property.id) &&
    isString(property.slug) &&
    isString(property.title) &&
    isString(property.location) &&
    isString(property.locality) &&
    isString(property.price) &&
    isString(property.priceQualifier) &&
    (property.originalPrice === undefined || isString(property.originalPrice)) &&
    propertyPurposes.includes(property.purpose as PropertyPurpose) &&
    propertyTypes.includes(property.type as PropertyType) &&
    constructionStatuses.includes(
      property.constructionStatus as ConstructionStatus,
    ) &&
    isNumber(property.bedrooms) &&
    isNumber(property.bathrooms) &&
    isString(property.area) &&
    isString(property.floor) &&
    isString(property.parking) &&
    isString(property.furnishing) &&
    (property.status === "Live" || property.status === "Draft") &&
    isNumber(property.views) &&
    isNumber(property.enquiries) &&
    isString(property.published) &&
    isString(property.description) &&
    Array.isArray(property.highlights) &&
    property.highlights.every(isString) &&
    Array.isArray(property.images) &&
    property.images.length > 0 &&
    property.images.every(isString)
  );
}

export function isPropertyCollection(
  value: unknown,
): value is PropertyCollection {
  if (!value || typeof value !== "object") return false;
  const collection = value as Partial<PropertyCollection>;
  return (
    isString(collection.id) &&
    isString(collection.slug) &&
    isString(collection.name) &&
    isString(collection.description) &&
    Array.isArray(collection.propertyIds) &&
    collection.propertyIds.every(isString) &&
    (collection.status === "Published" || collection.status === "Draft")
  );
}

export function createPropertyPreviewUrl(
  property: Property,
  baseUrl = publicAppUrl,
) {
  const normalizedProperty = normalizePropertyAvailability(property);
  // A Live listing is published to its own public page when it is saved, so it
  // shares as a clean /listing/<slug>. Only a draft needs to carry its payload,
  // because there is nothing public for that URL to resolve to yet.
  //
  // This used to also require a match against the seeded inventory, which is
  // now empty — every listing therefore failed the check and every shared link
  // dragged several kilobytes of base64 behind it.
  const path =
    normalizedProperty.status === "Live"
      ? `/listing/${encodeURIComponent(normalizedProperty.slug)}`
      : `/listing/${encodeURIComponent(normalizedProperty.slug)}?preview=${encodePreviewPayload(normalizedProperty)}`;
  return `${baseUrl}${path}`;
}

export function decodePropertyPreview(
  preview: string | string[] | undefined,
) {
  const value = Array.isArray(preview) ? preview[0] : preview;
  if (!value) return undefined;
  const decoded = decodePreviewPayload(value);
  return isProperty(decoded)
    ? normalizePropertyAvailability(decoded)
    : undefined;
}

interface CollectionPreviewPayload {
  collection: PropertyCollection;
  properties: Property[];
}

export function createCollectionPreviewUrl(
  collection: PropertyCollection,
  collectionProperties: Property[],
  baseUrl = publicAppUrl,
) {
  // Same reasoning as a listing: a published collection has its own public
  // page, so it shares as a clean URL. Only a draft has to carry its payload.
  // The previous check compared against the seeded collections, which are now
  // empty, so every share link embedded the whole collection — several
  // properties' worth of base64 in a WhatsApp message.
  if (collection.status === "Published") {
    return `${baseUrl}/collection/${encodeURIComponent(collection.slug)}`;
  }

  const payload: CollectionPreviewPayload = {
    collection,
    properties: collectionProperties.map(normalizePropertyAvailability),
  };
  return `${baseUrl}/collection/${encodeURIComponent(collection.slug)}?preview=${encodePreviewPayload(payload)}`;
}

export function decodeCollectionPreview(
  preview: string | string[] | undefined,
) {
  const value = Array.isArray(preview) ? preview[0] : preview;
  if (!value) return undefined;
  const decoded = decodePreviewPayload(value);
  if (!decoded || typeof decoded !== "object") return undefined;
  const payload = decoded as Partial<CollectionPreviewPayload>;
  if (
    !isPropertyCollection(payload.collection) ||
    !Array.isArray(payload.properties) ||
    !payload.properties.every(isProperty)
  ) {
    return undefined;
  }
  return {
    collection: payload.collection,
    properties: payload.properties.map(normalizePropertyAvailability),
  };
}

function createWhatsAppMessageUrl(message: string, recipient?: string) {
  const normalizedRecipient = recipient?.replace(/\D/g, "");
  // No per-agent number configured: fall back to the brand's own short link,
  // which resolves to the right inbox but cannot carry a prefilled message.
  if (!normalizedRecipient) return AGENT_WHATSAPP_LINK;
  return `https://wa.me/${normalizedRecipient}?text=${encodeURIComponent(message)}`;
}

export function createWhatsAppUrl(
  property: Property,
  recipient: string = property.assignedAgentWhatsApp ?? AGENT_WHATSAPP_NUMBER,
) {
  const advisorName = property.assignedAgentName ?? AGENT_NAME;
  const message = `Hi ${advisorName}, I'm interested in ${property.title} in ${property.location}. Please share the best available price, unit options and payment plan.\n\n${createPropertyPreviewUrl(property)}`;
  return createWhatsAppMessageUrl(message, recipient);
}

/** Buyer asking to be shown the property in person. */
export function createSiteVisitWhatsAppUrl(
  property: Property,
  recipient: string = property.assignedAgentWhatsApp ?? AGENT_WHATSAPP_NUMBER,
) {
  const advisorName = property.assignedAgentName ?? AGENT_NAME;
  const isRental = property.purpose === "For Rent";
  const viewing = isRental ? "a viewing" : "a site visit";
  const message = `Hi ${advisorName}, I'm interested in ${property.title} in ${property.location}. I'd like to book ${viewing} — please share the available times.\n\n${createPropertyPreviewUrl(property)}`;
  return createWhatsAppMessageUrl(message, recipient);
}

export function createPropertyShareWhatsAppUrl(
  property: Property,
  recipient?: string,
  publishedUrl?: string,
) {
  const category = getProjectCategory(property);
  const message = `Hi, I found a Dubai property you may like:\n\n*${property.title}*\n${property.location} · ${category}\n${property.bedrooms || "Studio"} bed · ${property.area}\n${property.handover ? `Handover: ${property.handover}\n` : ""}${property.paymentPlan ? `Payment plan: ${property.paymentPlan}\n` : ""}\nExplore photos and full details:\n${publishedUrl ?? createPropertyPreviewUrl(property)}\n\nReply here and I'll secure the best available offer for you.`;
  return createWhatsAppMessageUrl(message, recipient);
}

export function createMultiPropertyWhatsAppUrl(
  selectedProperties: Property[],
  recipient?: string,
  publishedUrls?: Array<string | undefined>,
) {
  const propertyList = selectedProperties
    .map(
      (property, index) =>
        `${index + 1}. *${property.title}*\n${property.location} · ${getProjectCategory(property)}\n${property.bedrooms || "Studio"} bed · ${property.area}\nView: ${publishedUrls?.[index] ?? createPropertyPreviewUrl(property)}`,
    )
    .join("\n\n");
  const message = `Hi, I've curated ${selectedProperties.length} Dubai properties for you:\n\n${propertyList}\n\nTell me which options stand out and I'll share the best available price and arrange a viewing.`;
  return createWhatsAppMessageUrl(message, recipient);
}
