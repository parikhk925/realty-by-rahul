import "server-only";
import { put } from "@vercel/blob";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/lib/property-data";
import { computeListingPdfHash } from "@/lib/pdf/listing-pdf-hash";
import { generateListingPdfBuffer } from "@/lib/pdf/generate-listing-pdf";
import { refreshPublishedPdfFields } from "@/lib/published-properties";

/**
 * Reuses the caller's already-authenticated request-scoped client rather than
 * an admin client — the same RLS that allows the save itself (admin, or the
 * listing's own agent) covers this write, so no service-role secret is
 * needed for a feature that only ever touches a property the caller could
 * already edit.
 */
async function setPdfStatus(
  supabase: SupabaseClient,
  propertyId: string,
  patch: Partial<Property>,
) {
  const { data: row } = await supabase
    .from("properties")
    .select("data")
    .eq("id", propertyId)
    .maybeSingle();
  if (!row) {
    console.error(`[listing-pdf] no row for ${propertyId} when writing`, patch);
    return;
  }
  const merged = { ...(row.data as Property), ...patch };
  const { error } = await supabase
    .from("properties")
    .update({ data: merged })
    .eq("id", propertyId);
  if (error) {
    // Previously unchecked, so a rejected write left the listing showing
    // "generating" for good with no trace of why.
    console.error(`[listing-pdf] status write failed for ${propertyId}:`, error);
  }
  await refreshPublishedPdfFields(merged);
}

/**
 * Generates the listing PDF exactly once per meaningful content change.
 * Called fire-and-forget after a Live save completes — must never throw back
 * into the caller, since a PDF failure must not surface as a save failure.
 */
export async function generateAndStoreListingPdf(
  property: Property,
  supabase: SupabaseClient,
): Promise<void> {
  if (property.status !== "Live") return;

  const nextHash = computeListingPdfHash(property);
  if (property.pdfUrl && property.pdfContentHash === nextHash) {
    // Content unchanged since the last generation — nothing to regenerate,
    // but the published snapshot (a separate frozen copy the public site
    // actually renders) may still be missing the PDF fields if this listing
    // was published before the PDF finished, or before this field existed.
    //
    // The stored row is read rather than trusting the copy that came in with
    // the save. That copy carries whatever pdf fields the caller happened to
    // hold, and a listing saved again while a generation was still running
    // carried "generating" — which then pinned the snapshot to "generating"
    // for good, leaving buyers on the raw brochure even though the finished
    // PDF existed.
    const { data: row } = await supabase
      .from("properties")
      .select("data")
      .eq("id", property.id)
      .maybeSingle();
    await refreshPublishedPdfFields((row?.data as Property) ?? property);
    return;
  }

  try {
    await setPdfStatus(supabase, property.id, { pdfStatus: "generating" });

    const buffer = await generateListingPdfBuffer(property);
    const blob = await put(`listing-pdfs/${property.slug}.pdf`, buffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 300,
    });

    await setPdfStatus(supabase, property.id, {
      pdfUrl: blob.url,
      pdfGeneratedAt: new Date().toISOString(),
      pdfContentHash: nextHash,
      pdfStatus: "ready",
    });
  } catch (error) {
    console.error(`[listing-pdf] generation failed for ${property.slug}:`, error);
    await setPdfStatus(supabase, property.id, { pdfStatus: "failed" }).catch(() => {
      // Best-effort status update; the underlying failure is already logged.
    });
  }
}
