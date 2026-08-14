import { getDossierUrl } from "@/lib/property-data";
import { getPublishedProperty } from "@/lib/published-properties";

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
  const published = await getPublishedProperty(slug);
  const property = published?.property;

  // Drafts are not public inventory, so their dossiers are not either.
  if (!property || property.status !== "Live") {
    return new Response("Not found", { status: 404 });
  }

  const source = getDossierUrl(property);
  // Only ever proxy our own storage — this endpoint takes a slug, not a URL,
  // but the stored value should still be checked before the server fetches it.
  if (
    !source ||
    !/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(source)
  ) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(source, {
    signal: AbortSignal.timeout(20_000),
  }).catch(() => undefined);
  if (!upstream?.ok || !upstream.body) {
    return new Response("The dossier could not be loaded.", { status: 502 });
  }

  // Latin-1 is all a bare filename= can carry, so send an ASCII-safe name for
  // older clients and the real title via the UTF-8 form.
  const readableName = `${property.title} - listing details.pdf`;
  const asciiName = readableName.replace(/[^ -~]/g, "-").replace(/"/g, "");

  return new Response(upstream.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(readableName)}`,
      "cache-control": "public, max-age=300",
    },
  });
}
