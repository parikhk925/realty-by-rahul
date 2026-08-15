import { getDossierUrl, getPropertyBySlug } from "@/lib/property-data";
import { getPublishedProperty } from "@/lib/published-properties";
import { generateListingPdfBuffer } from "@/lib/pdf/generate-listing-pdf";

// The generator uses @react-pdf/renderer and pdf-lib, which need Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the dossier this site generates: the unit's terms, the floor plan
 * and the location page.
 *
 * Separate from /brochure, which hands over the developer's own document
 * untouched. Streaming this through our domain rather than linking Blob
 * storage keeps the brand in the buyer's address bar and gives the saved file
 * a readable name.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // Published snapshots win; otherwise fall back to the portfolio's own
  // inventory, so a listing that was never pushed through Blob still has a
  // downloadable dossier.
  const published = await getPublishedProperty(slug);
  const property = published?.property ?? getPropertyBySlug(slug);

  // Drafts are not public inventory, so their dossiers are not either.
  if (!property || property.status !== "Live") {
    return new Response("Not found", { status: 404 });
  }

  // Latin-1 is all a bare filename= can carry, so send an ASCII-safe name for
  // older clients and the real title via the UTF-8 form.
  const readableName = `${property.title} - listing details.pdf`;
  const asciiName = readableName.replace(/[^ -~]/g, "-").replace(/"/g, "");
  const headers = {
    "content-type": "application/pdf",
    "content-disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(readableName)}`,
    "cache-control": "public, max-age=300",
  };

  const source = getDossierUrl(property);
  // Only ever proxy our own storage — this endpoint takes a slug, not a URL,
  // but the stored value should still be checked before the server fetches it.
  const isStoredFile =
    Boolean(source) &&
    /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(source!);

  if (isStoredFile) {
    const upstream = await fetch(source!, {
      signal: AbortSignal.timeout(20_000),
    }).catch(() => undefined);
    if (!upstream?.ok || !upstream.body) {
      return new Response("The dossier could not be loaded.", { status: 502 });
    }
    return new Response(upstream.body, { headers });
  }

  // No stored file: build it on the fly. Slower than serving a cached object,
  // but it means the download works without Blob storage configured at all.
  try {
    const buffer = await generateListingPdfBuffer(property);
    return new Response(new Uint8Array(buffer), { headers });
  } catch (error) {
    console.error(
      "dossier.generate_failed",
      error instanceof Error ? error.message : "unknown",
    );
    return new Response("The dossier could not be generated.", { status: 502 });
  }
}
