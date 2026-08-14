import "server-only";

import { del, get, list, put } from "@vercel/blob";
import { revalidateTag, unstable_cache } from "next/cache";
import { isProperty, Property } from "@/lib/property-data";

export interface PublishedPropertyPayload {
  property: Property;
  publishedAt: string;
}

export function isPublishedPropertyPayload(
  value: unknown,
): value is PublishedPropertyPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<PublishedPropertyPayload>;
  return isProperty(payload.property) && typeof payload.publishedAt === "string";
}

export async function getPublishedProperty(slug: string) {
  try {
    const result = await get(`projects/${slug}.json`, {
      access: "public",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return undefined;
    const value = (await new Response(result.stream).json()) as unknown;
    return isPublishedPropertyPayload(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The public listing page renders this frozen snapshot, not the live
 * Supabase row — so once a listing has been shared/published, its PDF
 * fields (generated asynchronously, after publish already happened) must
 * be patched back in here or the download button never appears. Does
 * nothing for a listing that was never published, since that snapshot
 * intentionally shouldn't exist yet.
 */
export async function refreshPublishedPdfFields(property: Property) {
  try {
    const existing = await getPublishedProperty(property.slug);
    if (!existing) return;
    // The caller passes the stored row, so it is written whole rather than
    // patched onto whatever the snapshot happened to hold.
    //
    // Patching the cached snapshot is what silently discarded edits: the read
    // above is cached, so a save that added a field and then triggered PDF
    // generation had that field written by syncPublishedProperty and wiped
    // moments later when this rewrote the pre-save copy it still had. An
    // original price entered in the editor reached the database and never
    // reached a buyer.
    const payload: PublishedPropertyPayload = {
      property,
      publishedAt: existing.publishedAt,
    };
    await put(`projects/${property.slug}.json`, JSON.stringify(payload), {
      access: "public",
      contentType: "application/json; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
  } catch (error) {
    // Best-effort — the live Supabase row already has the correct status —
    // but silence here is what made a stale snapshot impossible to diagnose.
    console.error("[listing-pdf] snapshot refresh failed:", error);
  }
}

/**
 * Mirrors a listing into the public snapshot the buyer-facing pages read.
 *
 * Those pages render from Blob, not Supabase, so setting a listing Live in the
 * studio used to change nothing publicly until someone happened to open the
 * WhatsApp share dialog — "Live" and "actually visible" were separate states,
 * which is not what the switch appears to promise. Taking a listing off Live
 * removes the snapshot again.
 */
/**
 * Removes a listing's public snapshot and its generated dossier.
 *
 * Deleting a project cleared the database row and left the snapshot behind, so
 * the listing stayed on the public site and kept serving its documents — with
 * nothing left in the studio to edit or delete it with.
 */
export async function unpublishProperty(slug: string) {
  await del(`projects/${slug}.json`).catch(() => {});
  await del(`listing-pdfs/${slug}.pdf`).catch(() => {});
  revalidateTag("published-properties");
}

export async function syncPublishedProperty(property: Property) {
  try {
    if (property.status !== "Live") {
      await del(`projects/${property.slug}.json`).catch(() => {});
      revalidateTag("published-properties");
      return;
    }
    const existing = await getPublishedProperty(property.slug);
    const payload: PublishedPropertyPayload = {
      property,
      publishedAt: existing?.publishedAt ?? new Date().toISOString(),
    };
    await put(`projects/${property.slug}.json`, JSON.stringify(payload), {
      access: "public",
      contentType: "application/json; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    revalidateTag("published-properties");
  } catch {
    // Best-effort: a snapshot failure must not fail the save itself.
  }
}

async function fetchPublishedProperties() {
  try {
    const result = await list({
      prefix: "projects/",
      limit: 100,
    });
    const payloads = await Promise.all(
      result.blobs
        .filter((blob) => blob.pathname.endsWith(".json"))
        .map(async (blob) => {
          try {
            const response = await fetch(blob.url, {
              next: { revalidate: 60 },
            });
            if (!response.ok) return undefined;
            const value = (await response.json()) as unknown;
            return isPublishedPropertyPayload(value) ? value : undefined;
          } catch {
            return undefined;
          }
        }),
    );
    return payloads
      .filter((payload): payload is PublishedPropertyPayload => Boolean(payload))
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  } catch {
    return [];
  }
}

export const getPublishedProperties = unstable_cache(
  fetchPublishedProperties,
  ["published-properties-v1"],
  { revalidate: 60, tags: ["published-properties"] },
);
