import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import type { Property } from "@/lib/property-data";
import { publicAppUrl } from "@/lib/property-data";
import { buildListingQrCode } from "@/lib/pdf/listing-qr";
import { readBrandAccent, DEFAULT_ACCENT } from "@/lib/pdf/brand-accent";
import {
  ListingPdfDocument,
  buildMapsUrl,
} from "@/lib/pdf/listing-pdf-document";

/** An attachment larger than this is not worth pulling into a download. */
const MAX_ATTACHMENT_BYTES = 40 * 1024 * 1024;

/** Fetches an attached PDF, or nothing if it will not download or is oversized. */
async function fetchPdf(url: string): Promise<Buffer | undefined> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  }).catch(() => undefined);
  if (!response?.ok) return undefined;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_ATTACHMENT_BYTES) return undefined;
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") return undefined;
  return buffer;
}

/**
 * Inserts the floor plan into our own pages, keeping the location page last.
 *
 * The developer's brochure is deliberately not merged in. It is offered as its
 * own download so a buyer gets the developer's document exactly as published,
 * and this one stays a short dossier they can read in a minute.
 *
 * Floor plan pages are copied rather than re-rendered, so their line work and
 * text survive intact.
 */
async function withFloorPlan(
  ours: Buffer,
  floorPlan: Buffer | undefined,
): Promise<Buffer> {
  if (!floorPlan) return ours;
  const doc = await PDFDocument.load(new Uint8Array(ours));
  const plan = await PDFDocument.load(new Uint8Array(floorPlan), {
    ignoreEncryption: true,
  });
  const pages = await doc.copyPages(plan, plan.getPageIndices());
  // One before the end: the closing page carries the map and has to stay there.
  const insertAt = Math.max(doc.getPageCount() - 1, 0);
  pages.forEach((page, index) => doc.insertPage(insertAt + index, page));
  return Buffer.from(await doc.save());
}

export async function generateListingPdfBuffer(property: Property): Promise<Buffer> {
  // Attachments are fetched once and reused: the brochure is both merged into
  // the document and read for its colour.
  const [brochure, floorPlan] = await Promise.all([
    property.brochure?.url ? fetchPdf(property.brochure.url).catch(() => undefined) : undefined,
    property.floorPlan?.url ? fetchPdf(property.floorPlan.url).catch(() => undefined) : undefined,
  ]);

  const [accent, mapQrDataUrl] = await Promise.all([
    brochure ? readBrandAccent(brochure).catch(() => DEFAULT_ACCENT) : DEFAULT_ACCENT,
    buildListingQrCode(buildMapsUrl(property)),
  ]);

  const generatedAt = new Date().toISOString();
  const ours = await renderToBuffer(
    ListingPdfDocument({ property, accent, mapQrDataUrl, generatedAt }),
  );

  // An attachment that will not download or parse must never cost the listing
  // its PDF — the detail pages alone are still a usable document.
  // A floor plan that will not parse must never cost the listing its dossier.
  return await withFloorPlan(ours, floorPlan).catch(() => ours);
}
