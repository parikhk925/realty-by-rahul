import { authorizeStudioRequest } from "@/lib/supabase/api-auth";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import {
  extractListingFromBrochure,
  extractListingFromBrochureText,
  readUploadedBrochure,
  type ExtractedListing,
  type UploadedBrochure,
} from "@/lib/ai/brochure-extraction";
import { MAX_BROCHURE_BYTES } from "@/lib/ai/developer-assets";
import { ModelBusyError } from "@/lib/ai/json-model";

export const maxDuration = 60;

export interface ExtractFieldsResponse {
  fields?: ExtractedListing;
  /** True once the document's own branding confirms it is the developer's. */
  brochureVerified?: boolean;
  message?: string;
  error?: string;
}

/**
 * A brochure taken off a broker or portal is only cleared for customers once
 * the document itself names the developer as its publisher.
 */
function verify(
  fields: ExtractedListing,
  input: { developer?: string; needsVerification?: boolean },
): ExtractFieldsResponse {
  if (!input.needsVerification) return { fields, brochureVerified: true };
  const publisher = fields.documentPublisher;
  const brochureVerified = Boolean(
    publisher && input.developer && namesMatch(publisher, input.developer),
  );
  return {
    fields,
    brochureVerified,
    message: brochureVerified
      ? undefined
      : publisher
        ? `The brochure found online carries ${publisher} branding, so it was not attached. Upload the developer's own copy.`
        : "Could not confirm the brochure found online is the developer's own, so it was not attached.",
  };
}

/** Loose comparison — "Emaar" should match "Emaar Properties". */
function namesMatch(left: string, right: string) {
  const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const a = norm(left);
  const b = norm(right);
  return a.length > 2 && b.length > 2 && (a.includes(b) || b.includes(a));
}

/**
 * Second half of auto-fill: reads a brochure already stored in our own Blob.
 *
 * Finding the brochure and reading it used to happen in one request, which
 * measured 60.8s against a 60s function limit — it timed out, and the browser
 * got an HTML error page instead of JSON ("could not reach the server").
 * Splitting it keeps both halves well inside the limit on any plan, and the
 * admin sees photos and the brochure land while the text is still being read.
 */
export async function POST(request: Request) {
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Sign in to use auto-fill." }, { status: 401 });
  }
  if (!isGeminiConfigured()) {
    return Response.json(
      { error: "Field extraction is not configured (missing GEMINI_API_KEY)." },
      { status: 503 },
    );
  }

  try {
    const input = (await request.json()) as {
      brochureUrl?: string;
      developer?: string;
      needsVerification?: boolean;
      uploaded?: UploadedBrochure;
    };
    const brochureUrl = input.brochureUrl ?? "";

    // Only our own Blob store, so this cannot be used to make the server
    // fetch arbitrary URLs.
    if (!/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(brochureUrl)) {
      return Response.json({ error: "Unknown brochure location." }, { status: 400 });
    }

    const response = await fetch(brochureUrl, {
      signal: AbortSignal.timeout(25_000),
    }).catch(() => undefined);
    if (!response?.ok) {
      return Response.json({ error: "The brochure could not be read." }, { status: 502 });
    }
    const pdf = Buffer.from(await response.arrayBuffer());
    if (pdf.length === 0 || pdf.length > MAX_BROCHURE_BYTES) {
      return Response.json({ error: "The brochure is too large to read." }, { status: 413 });
    }

    // Reading the text layer takes about six seconds and barely varies.
    // Sending the file itself took anywhere from 19 to 258 seconds for the
    // same brochure, so it is now only the fallback for a scanned PDF with no
    // text to read.
    const fromText = await extractListingFromBrochureText(pdf).catch(
      () => undefined,
    );
    if (fromText) return Response.json(verify(fromText, input));

    const fields = await extractListingFromBrochure(pdf);
    return Response.json(verify(fields, input));
  } catch (error) {
    // Upstream overload is temporary and the admin can act on it, so it gets
    // its own status and a sentence in plain English. Anything else must not
    // reach the screen as a raw provider payload — the client was shown a bare
    // {"error":{"code":503,...}} blob.
    if (error instanceof ModelBusyError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("extract-fields failed", error);
    return Response.json(
      { error: "The brochure could not be read. Try again, or fill the fields by hand." },
      { status: 500 },
    );
  }
}
