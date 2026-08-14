import "server-only";
import { Type, createPartFromUri, createUserContent } from "@google/genai";
import { extractText, getDocumentProxy } from "unpdf";
import {
  possessionMonths,
  propertyTypes,
  type PossessionMonth,
  type PropertyType,
} from "@/lib/property-data";
import { createGeminiClient, GEMINI_MODEL } from "@/lib/ai/gemini";
import { generateJson, type JsonImage } from "@/lib/ai/json-model";
import { renderBrochurePages } from "@/lib/pdf/render-brochure-pages";

export interface ExtractedMilestone {
  label: string;
  percentage: number;
}

/**
 * Mirrors the subset of `ListingDraft` a brochure can realistically answer.
 * Everything is optional — the admin reviews and completes the rest, and a
 * missing field must never block the rest of the extraction.
 */
export interface ExtractedListing {
  title?: string;
  developer?: string;
  community?: string;
  location?: string;
  price?: string;
  priceQualifier?: string;
  type?: PropertyType;
  constructionStatus?: "Handed Over" | "Off-plan";
  handover?: string;
  possessionMonth?: PossessionMonth;
  possessionYear?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  floor?: string;
  parking?: string;
  furnishing?: string;
  ownership?: string;
  paymentPlan?: string;
  paymentMilestones?: ExtractedMilestone[];
  postHandoverPaymentPlan?: boolean;
  permitNumber?: string;
  serviceCharge?: string;
  expectedYield?: string;
  description?: string;
  highlights?: string[];
  amenities?: string[];
  /**
   * Whose branding the document itself carries. Brokers republish developer
   * brochures with their own logo and contact details on them, and serving one
   * of those to a buyer would advertise a competing agency — so the caller uses
   * this to decide whether the file is safe to hand out.
   */
  documentPublisher?: string;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, nullable: true },
    developer: { type: Type.STRING, nullable: true },
    community: { type: Type.STRING, nullable: true },
    location: { type: Type.STRING, nullable: true },
    price: { type: Type.STRING, nullable: true },
    priceQualifier: { type: Type.STRING, nullable: true },
    type: { type: Type.STRING, enum: propertyTypes, nullable: true },
    constructionStatus: {
      type: Type.STRING,
      enum: ["Handed Over", "Off-plan"],
      nullable: true,
    },
    handover: { type: Type.STRING, nullable: true },
    possessionMonth: { type: Type.STRING, enum: possessionMonths, nullable: true },
    possessionYear: { type: Type.INTEGER, nullable: true },
    bedrooms: { type: Type.INTEGER, nullable: true },
    bathrooms: { type: Type.INTEGER, nullable: true },
    area: { type: Type.STRING, nullable: true },
    floor: { type: Type.STRING, nullable: true },
    parking: { type: Type.STRING, nullable: true },
    furnishing: { type: Type.STRING, nullable: true },
    ownership: { type: Type.STRING, nullable: true },
    paymentPlan: { type: Type.STRING, nullable: true },
    paymentMilestones: {
      type: Type.ARRAY,
      nullable: true,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          percentage: { type: Type.NUMBER },
        },
        required: ["label", "percentage"],
      },
    },
    postHandoverPaymentPlan: { type: Type.BOOLEAN, nullable: true },
    permitNumber: { type: Type.STRING, nullable: true },
    serviceCharge: { type: Type.STRING, nullable: true },
    expectedYield: { type: Type.STRING, nullable: true },
    description: { type: Type.STRING, nullable: true },
    highlights: { type: Type.ARRAY, nullable: true, items: { type: Type.STRING } },
    amenities: { type: Type.ARRAY, nullable: true, items: { type: Type.STRING } },
    documentPublisher: { type: Type.STRING, nullable: true },
  },
};

const PROMPT = `You are reading an official Dubai real-estate developer brochure.
Extract only facts that are actually stated in this document.

Rules:
- Leave a field null when the brochure does not state it. Never invent a
  number, permit, price or date. An empty field is far better than a wrong one.
- price: format as written for a Dubai listing, e.g. "AED 1.59M" or
  "AED 145K / year". Use the starting/from price when a range is given.
- priceQualifier: e.g. "Price from", "Starting price", "Annual rent".
- area: include the unit, e.g. "1,248 sq ft".
- handover: a short label such as "Q4 2028" or "Ready".
- paymentMilestones: each construction/booking/handover stage with its
  percentage. Percentages should sum to about 100.
- postHandoverPaymentPlan: true only if the brochure explicitly offers
  payments continuing after handover.
- description: 1-2 sentences of neutral marketing copy describing the
  property, drawn from the brochure's own language.
- highlights: up to 4 short selling points (2-4 words each).
- amenities: the facilities list, short names only.
- permitNumber: only a real RERA/Trakheesi/DLD permit number if printed.
- documentPublisher: the organisation whose logo, cover branding or contact
  details this document actually carries. If it is the developer's own
  brochure, name the developer. If a brokerage or agency has put its own
  branding, cover page or contact block on it, name that agency instead.
  Null only if the document carries no branding at all.`;

/**
 * Sends the brochure to Gemini via the Files API. Inline base64 would cap out
 * around 20MB of total request body and these brochures routinely run larger,
 * so the upload path is the only one that holds for real developer material.
 */
/**
 * Below this a PDF has no usable text layer — a scanned or purely pictorial
 * brochure — and only sending the file itself will read it.
 */
const MIN_USABLE_TEXT = 400;

/**
 * Characters of text per page, below which the brochure is really a picture
 * book and its words are artwork rather than text.
 *
 * Total length alone is not enough to judge that. Emaar's 144 page Club Place
 * brochure carries 4,245 characters — comfortably past any absolute floor, yet
 * about 30 characters a page, and the words "Club Place" appear nowhere in the
 * text layer at all. Reading only the text produced a listing with no title.
 * Lumena Alta, by contrast, runs about 290 characters a page and reads
 * perfectly from text alone.
 */
const MIN_CHARS_PER_PAGE = 120;

/** Enough to carry the cover, the project name and the opening spreads. */
const PAGES_TO_SHOW = 4;

/**
 * Reads a brochure from its text layer rather than by sending the file.
 *
 * Sending the PDF meant uploading ~19MB to Gemini and waiting on its document
 * pipeline, which timed the same brochure at 19s, 46s, 69s and 258s across
 * consecutive runs — unusable against a 60s function limit. The text layer of
 * that same brochure is 4,937 characters, extracts locally in 0.3s, and reads
 * back in 5.9-6.3s across runs with identical results. Falls back to the file
 * when there is no text to read.
 */
export async function extractListingFromBrochureText(
  pdf: Buffer,
): Promise<ExtractedListing | undefined> {
  let text = "";
  let pageCount = 1;
  try {
    const doc = await getDocumentProxy(new Uint8Array(pdf));
    pageCount = doc.numPages;
    const result = await extractText(doc, { mergePages: true });
    text = (
      Array.isArray(result.text) ? result.text.join("\n") : result.text
    ).trim();
  } catch {
    return undefined;
  }
  // A picture-book brochure gets its opening pages rendered and shown to the
  // model, which is where its name and developer actually are.
  const perPage = text.length / Math.max(pageCount, 1);
  let images: JsonImage[] = [];
  if (perPage < MIN_CHARS_PER_PAGE) {
    images = (await renderBrochurePages(pdf, PAGES_TO_SHOW).catch(() => [])).map(
      (page) => ({ mimeType: "image/jpeg", data: page.buffer }),
    );
  }

  // Nothing worth reading either way — the caller falls back to sending the
  // whole file.
  if (text.length < MIN_USABLE_TEXT && images.length === 0) return undefined;

  // Long brochures still fit comfortably; the cap only guards a pathological
  // document from blowing the request out.
  const out = await generateJson({
    prompt: `${PROMPT}${
      images.length
        ? "\n\nThe first pages of the brochure are attached as images. Most of this brochure's wording is artwork rather than text, so read the project name and developer from them."
        : ""
    }

BROCHURE TEXT:
${text.slice(0, 120_000)}`,
    schema: responseSchema,
    images,
  });
  if (!out) return undefined;
  return normalizeExtraction(JSON.parse(out) as Record<string, unknown>);
}

export interface UploadedBrochure {
  name: string;
  uri: string;
  mimeType: string;
}

/**
 * Uploads the brochure and waits for it to become readable.
 *
 * Separated from the read itself so the caller can pay this cost while it
 * still has the file in memory. Uploading 19MB takes about ten seconds, and
 * doing it inside the read request pushed that request close to its time
 * limit; Gemini keeps the file for 48 hours, so the handle survives easily
 * until the read runs.
 */
export async function uploadBrochureForReading(
  pdf: Buffer,
): Promise<UploadedBrochure> {
  const ai = createGeminiClient();
  const uploaded = await ai.files.upload({
    file: new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
    config: { mimeType: "application/pdf" },
  });
  if (!uploaded.name) throw new Error("Gemini did not return a file handle.");

  let file = uploaded;
  for (let attempt = 0; attempt < 30 && file.state === "PROCESSING"; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    file = await ai.files.get({ name: uploaded.name });
  }
  if (file.state !== "ACTIVE" || !file.uri || !file.mimeType) {
    throw new Error("Gemini could not process the brochure PDF.");
  }
  return { name: uploaded.name, uri: file.uri, mimeType: file.mimeType };
}

/** Reads a brochure already uploaded by `uploadBrochureForReading`. */
export async function readUploadedBrochure(
  file: UploadedBrochure,
): Promise<ExtractedListing> {
  const ai = createGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: createUserContent([
        createPartFromUri(file.uri, file.mimeType),
        PROMPT,
      ]),
      config: { responseMimeType: "application/json", responseSchema },
    });
    const text = response.text;
    if (!text) throw new Error("Gemini returned an empty response.");
    return normalizeExtraction(JSON.parse(text) as Record<string, unknown>);
  } finally {
    await ai.files.delete({ name: file.name }).catch(() => {});
  }
}

export async function extractListingFromBrochure(
  pdf: Buffer,
): Promise<ExtractedListing> {
  const ai = createGeminiClient();

  const uploaded = await ai.files.upload({
    file: new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
    config: { mimeType: "application/pdf" },
  });
  if (!uploaded.name) throw new Error("Gemini did not return a file handle.");

  try {
    let file = uploaded;
    // The Files API needs a moment to parse a large PDF before it can be
    // referenced; generateContent fails outright if it is still PROCESSING.
    for (let attempt = 0; attempt < 30 && file.state === "PROCESSING"; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      file = await ai.files.get({ name: uploaded.name });
    }
    if (file.state !== "ACTIVE" || !file.uri || !file.mimeType) {
      throw new Error("Gemini could not process the brochure PDF.");
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: createUserContent([
        createPartFromUri(file.uri, file.mimeType),
        PROMPT,
      ]),
      config: { responseMimeType: "application/json", responseSchema },
    });

    const text = response.text;
    if (!text) throw new Error("Gemini returned an empty response.");
    return normalizeExtraction(JSON.parse(text) as Record<string, unknown>);
  } finally {
    // Uploaded files expire on their own after 48h, but a brochure is large
    // and single-use here — dropping it immediately keeps the quota clean.
    await ai.files.delete({ name: uploaded.name }).catch(() => {});
  }
}

function cleanString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function cleanStringList(value: unknown, limit: number) {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((entry) => cleanString(entry))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, limit);
  return items.length > 0 ? items : undefined;
}

/**
 * Gemini honours the schema but still returns nulls and the occasional
 * out-of-range number, so every value is re-checked before it can reach a
 * draft the admin might save without noticing.
 */
function normalizeExtraction(raw: Record<string, unknown>): ExtractedListing {
  const milestones = Array.isArray(raw.paymentMilestones)
    ? raw.paymentMilestones
        .map((entry) => {
          const item = entry as Record<string, unknown>;
          const label = cleanString(item.label);
          const percentage = cleanNumber(item.percentage);
          if (!label || percentage === undefined) return undefined;
          return { label, percentage: Math.round(percentage) };
        })
        .filter((entry): entry is ExtractedMilestone => Boolean(entry))
        .slice(0, 8)
    : undefined;

  const possessionYear = cleanNumber(raw.possessionYear);
  const currentYear = new Date().getFullYear();

  return {
    title: cleanString(raw.title),
    developer: cleanString(raw.developer),
    community: cleanString(raw.community),
    location: cleanString(raw.location),
    price: cleanString(raw.price),
    priceQualifier: cleanString(raw.priceQualifier),
    type: propertyTypes.includes(raw.type as PropertyType)
      ? (raw.type as PropertyType)
      : undefined,
    constructionStatus:
      raw.constructionStatus === "Handed Over" ||
      raw.constructionStatus === "Off-plan"
        ? raw.constructionStatus
        : undefined,
    handover: cleanString(raw.handover),
    possessionMonth: possessionMonths.includes(raw.possessionMonth as PossessionMonth)
      ? (raw.possessionMonth as PossessionMonth)
      : undefined,
    // A handover year in the past means the model misread a copyright or
    // launch date, which would otherwise land silently in the listing.
    possessionYear:
      possessionYear !== undefined &&
      possessionYear >= currentYear &&
      possessionYear <= currentYear + 15
        ? possessionYear
        : undefined,
    bedrooms: cleanNumber(raw.bedrooms),
    bathrooms: cleanNumber(raw.bathrooms),
    area: cleanString(raw.area),
    floor: cleanString(raw.floor),
    parking: cleanString(raw.parking),
    furnishing: cleanString(raw.furnishing),
    ownership: cleanString(raw.ownership),
    paymentPlan: cleanString(raw.paymentPlan),
    paymentMilestones: milestones && milestones.length > 0 ? milestones : undefined,
    postHandoverPaymentPlan:
      typeof raw.postHandoverPaymentPlan === "boolean"
        ? raw.postHandoverPaymentPlan
        : undefined,
    permitNumber: cleanString(raw.permitNumber),
    serviceCharge: cleanString(raw.serviceCharge),
    expectedYield: cleanString(raw.expectedYield),
    description: cleanString(raw.description),
    highlights: cleanStringList(raw.highlights, 4),
    amenities: cleanStringList(raw.amenities, 12),
    documentPublisher: cleanString(raw.documentPublisher),
  };
}
