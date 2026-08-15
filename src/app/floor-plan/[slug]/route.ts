import { getPropertyBySlug } from "@/lib/property-data";
import { getPublishedProperty } from "@/lib/published-properties";

export const dynamic = "force-dynamic";

/**
 * Serves the unit's floor plan.
 *
 * The third of the three documents a buyer is offered, alongside /brochure and
 * /dossier. Streaming it through our domain rather than linking Blob storage
 * keeps the brand in the buyer's address bar and gives the saved file a name
 * that says which unit it belongs to.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const published = await getPublishedProperty(slug);
  // Published snapshots win; otherwise use the portfolio's own inventory.
  const property = published?.property ?? getPropertyBySlug(slug);

  // Drafts are not public inventory, so their floor plans are not either.
  if (!property || property.status !== "Live") {
    return new Response("Not found", { status: 404 });
  }

  const source = property.floorPlan?.url;
  // Only ever proxy our own storage — this endpoint takes a slug, not a URL,
  // but the stored value should still be checked before the server fetches it.
  // Either our own Blob storage, or a file shipped with the site under
  // /docs. Both are ours; anything else is not fetched.
  const isStored = Boolean(source) && /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(source!);
  const isLocalDoc = Boolean(source) && /^\/docs\/[\w.-]+\.pdf$/i.test(source!);
  if (!isStored && !isLocalDoc) {
    return new Response("Not found", { status: 404 });
  }

  // Narrowed by the isStored / isLocalDoc guard above.
  const resolved = source as string;
  const target = isLocalDoc
    ? new URL(resolved, request.url).toString()
    : resolved;
  const upstream = await fetch(target, {
    signal: AbortSignal.timeout(20_000),
  }).catch(() => undefined);
  if (!upstream?.ok || !upstream.body) {
    return new Response("The floor plan could not be loaded.", { status: 502 });
  }

  // Latin-1 is all a bare filename= can carry, so send an ASCII-safe name for
  // older clients and the real title via the UTF-8 form.
  const readableName = `${property.title} - floor plan.pdf`;
  const asciiName = readableName.replace(/[^ -~]/g, "-").replace(/"/g, "");

  return new Response(upstream.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(readableName)}`,
      "cache-control": "public, max-age=300",
    },
  });
}
