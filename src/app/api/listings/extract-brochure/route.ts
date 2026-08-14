import { put } from "@vercel/blob";
import { authorizeStudioRequest } from "@/lib/supabase/api-auth";
import {
  fetchDeveloperAssets,
  MAX_BROCHURE_BYTES,
} from "@/lib/ai/developer-assets";
import { renderBrochurePages } from "@/lib/pdf/render-brochure-pages";

export const maxDuration = 60;

const MAX_IMAGES = 6;
/** Page one becomes photo one, and so on down the brochure. */
const MAX_PAGE_IMAGES = 10;

export interface ExtractBrochureResponse {
  found: boolean;
  source?: "upload" | "developer-site" | "web";
  /** Stored in our own Blob, ready for the field-reading pass. */
  brochureUrl?: string;
  /** Attach to the listing so customers download the developer's own file. */
  brochure?: { url: string; name: string };
  /** True when the brochure came off the open web and is not yet trusted. */
  needsVerification?: boolean;
  images?: string[];
  message?: string;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "listing"
  );
}

/**
 * Renders brochure pages and stores them, keeping the brochure's page order.
 *
 * The gallery order is the brochure's order — page one is the first photo —
 * so these are uploaded together and read back by index rather than as they
 * happen to finish.
 */
async function storePageImages(pdf: Buffer, prefix: string) {
  const pages = await renderBrochurePages(pdf, MAX_PAGE_IMAGES).catch(() => []);
  const stored = await Promise.all(
    pages.map(async (page) => {
      try {
        const blob = await put(
          `property-images/${prefix}-page-${String(page.page).padStart(2, "0")}.jpg`,
          page.buffer,
          {
            access: "public",
            contentType: "image/jpeg",
            addRandomSuffix: true,
            cacheControlMaxAge: 60 * 60 * 24 * 365,
          },
        );
        return blob.url;
      } catch {
        return undefined;
      }
    }),
  );
  return stored.filter((url): url is string => Boolean(url));
}

function isOwnBlob(url: string) {
  return /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(url);
}

/**
 * First half of auto-fill: locate and store the brochure and project photos.
 *
 * Deliberately does no AI work. Finding assets and reading them in one request
 * measured 60.8s against a 60s function limit, so it timed out and the browser
 * received an HTML error page rather than JSON. Reading the text now happens
 * in /api/listings/extract-fields against the stored file.
 */
export async function POST(request: Request) {
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Sign in to use brochure auto-fill." }, { status: 401 });
  }

  try {
    const input = (await request.json()) as {
      title?: string;
      developer?: string;
      community?: string;
      brochureUrl?: string;
    };

    const title = input.title?.trim() ?? "";
    const developer = input.developer?.trim() ?? "";

    // An already-uploaded brochure needs no lookup at all — go straight to
    // reading it, which is by far the most reliable path. No title required:
    // reading the brochure is how the title gets filled in.
    if (input.brochureUrl && isOwnBlob(input.brochureUrl)) {
      // The text is read in the second pass; what is worth doing here is
      // turning the brochure's pages into the listing's photos, which needs
      // the file itself.
      const pdf = await fetch(input.brochureUrl, {
        signal: AbortSignal.timeout(25_000),
      })
        .then(async (response) =>
          response.ok ? Buffer.from(await response.arrayBuffer()) : undefined,
        )
        .catch(() => undefined);

      const response: ExtractBrochureResponse = {
        found: true,
        source: "upload",
        brochureUrl: input.brochureUrl,
        needsVerification: false,
        images: pdf
          ? await storePageImages(pdf, `${slugify(title || "listing")}-${Date.now()}`)
          : [],
      };
      return Response.json(response);
    }

    // Searching for the project needs something to search for.
    if (!title || !developer) {
      return Response.json({
        found: false,
        message:
          "Upload the brochure above, or add the listing title and developer so it can be searched for.",
      } satisfies ExtractBrochureResponse);
    }

    const assets = await fetchDeveloperAssets({
      title,
      developer,
      community: input.community?.trim() || undefined,
      imageLimit: MAX_IMAGES,
    }).catch(() => undefined);

    if (!assets || (!assets.brochure && assets.images.length === 0)) {
      return Response.json({
        found: false,
        message: `Nothing published for this project on ${developer}'s website or in search. Upload the brochure PDF and try again.`,
      } satisfies ExtractBrochureResponse);
    }

    const prefix = `${slugify(title)}-${Date.now()}`;

    // Pages out of the developer's own brochure beat whatever the project page
    // happens to serve, which is a mix of renders, banners and site furniture.
    const pageImages = assets.brochure
      ? await storePageImages(assets.brochure.buffer, prefix)
      : [];

    const uploadedImages = pageImages.length
      ? []
      : await Promise.all(
      assets.images.map(async (image, index) => {
        try {
          const blob = await put(
            `property-images/${prefix}-${index + 1}.jpg`,
            image.buffer,
            {
              access: "public",
              contentType: "image/jpeg",
              addRandomSuffix: true,
              cacheControlMaxAge: 60 * 60 * 24 * 365,
            },
          );
          return blob.url;
        } catch {
          return undefined;
        }
      }),
    );

    let storedBrochure: string | undefined;
    if (assets.brochure && assets.brochure.buffer.length <= MAX_BROCHURE_BYTES) {
      try {
        const blob = await put(
          `property-documents/${prefix}-brochure.pdf`,
          assets.brochure.buffer,
          {
            access: "public",
            contentType: "application/pdf",
            addRandomSuffix: true,
            cacheControlMaxAge: 60 * 60 * 24 * 365,
          },
        );
        storedBrochure = blob.url;
      } catch {
        // Storage failure just means no brochure this run.
      }
    }

    const fromDeveloperSite = assets.brochure?.fromDeveloperSite ?? false;
    const response: ExtractBrochureResponse = {
      found: true,
      source: assets.brochure
        ? fromDeveloperSite
          ? "developer-site"
          : "web"
        : "developer-site",
      brochureUrl: storedBrochure,
      // Only a brochure from the developer's own site is trusted immediately.
      // One found in open search is held back until the field pass confirms
      // whose branding it carries — brokers republish these under their own.
      brochure:
        storedBrochure && fromDeveloperSite
          ? { url: storedBrochure, name: `${title} brochure.pdf` }
          : undefined,
      needsVerification: Boolean(storedBrochure) && !fromDeveloperSite,
      images: pageImages.length
        ? pageImages
        : uploadedImages.filter((url): url is string => Boolean(url)),
    };
    return Response.json(response);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "The brochure could not be found.",
      },
      { status: 500 },
    );
  }
}
