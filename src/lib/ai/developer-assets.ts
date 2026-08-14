import "server-only";
import { createHash } from "node:crypto";
import type SharpType from "sharp";

const MIN_EDGE_PX = 700;
const MAX_IMAGE_CANDIDATES = 60;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_BROCHURE_BYTES = 30 * 1024 * 1024;

/**
 * Imported on demand rather than at module load. sharp is a native module, and
 * a top-level import meant a failure to load it crashed the whole route —
 * including the uploaded-brochure path, which never touches an image.
 */
async function loadSharp(): Promise<typeof SharpType | undefined> {
  try {
    return (await import("sharp")).default;
  } catch {
    return undefined;
  }
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const HOST_STOPWORDS = new Set([
  "properties", "property", "developments", "development", "developer",
  "developers", "group", "real", "estate", "holding", "holdings", "the",
  "and", "llc", "dubai", "uae", "international", "private", "seller",
  "landlord", "owner",
]);

export interface DeveloperImage {
  buffer: Buffer;
  width: number;
  height: number;
}

export interface DeveloperAssets {
  sourcePage: string;
  brochure?: {
    url: string;
    buffer: Buffer;
    /** False when it came off a broker or portal and still needs verifying. */
    fromDeveloperSite: boolean;
  };
  images: DeveloperImage[];
}

/**
 * "Emaar Properties" -> emaar.com, "Damac Properties" -> damacproperties.com.
 *
 * Both the trimmed and the untrimmed name are tried. Stripping words like
 * "Properties" is right for Emaar but wrong for Damac and Ellington, who keep
 * it in their domain — dropping it derived damac.com (dead) and ellington.com
 * (an unrelated company), so those two developers silently returned nothing.
 */
function candidateDomains(developer: string) {
  const all = developer
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  const trimmed = all.filter((token) => !HOST_STOPWORDS.has(token));
  if (trimmed.length === 0) return [];

  const stems = Array.from(
    new Set([trimmed[0], trimmed.join(""), all.join("")]),
  );
  // Longest stem first: damacproperties.com should be preferred over
  // damac.com, which can belong to somebody else entirely.
  stems.sort((left, right) => right.length - left.length);

  return Array.from(
    new Set(stems.flatMap((stem) => [`${stem}.com`, `${stem}.ae`])),
  );
}

function isSafePublicUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  ) {
    return undefined;
  }
  return url;
}

async function search(query: string, domains?: string[]) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 20,
      ...(domains ? { include_domains: domains } : {}),
    }),
    signal: AbortSignal.timeout(25_000),
  }).catch(() => undefined);
  if (!response?.ok) return [];
  const payload = (await response.json()) as { results?: { url?: string }[] };
  return (payload.results ?? [])
    .map((result) => result.url)
    .filter((url): url is string => Boolean(url?.startsWith("https://")));
}

/**
 * Brochure URLs found anywhere on the open web — brokers and portals mirror
 * developer brochures, and those copies are often the only ones indexed.
 * Whether a given file is really the developer's own document, rather than a
 * broker's rebranded version, is decided later by reading it.
 */
async function findBrochureCandidates(input: {
  title: string;
  developer: string;
  community?: string;
}) {
  const urls = await search(
    `${input.title} ${input.community ?? ""} ${input.developer} brochure pdf`.trim(),
  );
  return urls.filter((url) => url.toLowerCase().split("?")[0].endsWith(".pdf"));
}

async function findProjectPage(input: {
  title: string;
  developer: string;
  community?: string;
}) {
  const domains = candidateDomains(input.developer);
  if (domains.length === 0) return undefined;

  const urls = await search(
    `${input.title} ${input.community ?? ""} ${input.developer}`.trim(),
    domains,
  );
  const payload = { results: urls.map((url) => ({ url })) };

  // include_domains is only a hint — Tavily honoured it on one call and
  // returned nothing but broker sites on the next, which silently pointed the
  // whole extraction at a page with none of the developer's assets on it. The
  // host is re-checked here so a broker page can never be mistaken for the
  // developer's own.
  return payload.results
    ?.map((result) => result.url)
    .find((url) => {
      if (!url?.startsWith("https://")) return false;
      try {
        const host = new URL(url).hostname.toLowerCase();
        return domains.some(
          (domain) => host === domain || host.endsWith(`.${domain}`),
        );
      } catch {
        return false;
      }
    });
}

/**
 * Asset URLs are rarely plain `href`s. Emaar ships them inside an embedded
 * JSON payload with the separators percent- and backslash-escaped, which is
 * why querying the DOM for `a[href$=".pdf"]` finds nothing on a page whose
 * brochure is in fact public. decodeURIComponent cannot be used to undo it —
 * one stray "%" in the document makes it throw — so only the separators are
 * rewritten.
 */
function decodeMarkup(html: string) {
  return html
    .replace(/%25/gi, "%")
    .replace(/%2F/gi, "/")
    .replace(/%3A/gi, ":")
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/");
}

function extractUrls(markup: string, extensions: string) {
  const pattern = new RegExp(
    `https://[A-Za-z0-9._-]+/[^\\s"'<>\\\\)]+?\\.(?:${extensions})`,
    "gi",
  );
  return Array.from(new Set(markup.match(pattern) ?? []));
}

async function download(url: URL, limit: number) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": BROWSER_UA },
    signal: AbortSignal.timeout(30_000),
  }).catch(() => undefined);
  if (!response?.ok) return undefined;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > limit) return undefined;
  return buffer;
}

/**
 * Reads the brochure and project renders a developer publishes on their own
 * project page, in a single fetch.
 *
 * Provenance is the page rather than the image host: developers serve assets
 * from wherever their CMS lives — Emaar from a uae-cms subdomain, Omniyat via
 * Webflow's CDN — so filtering to the developer's own domain missed half of
 * them. What makes an asset theirs is that their own project page publishes it.
 *
 * Only openly served files are taken. Anything behind a lead-capture form
 * stays there.
 */
export async function fetchDeveloperAssets(input: {
  title: string;
  developer: string;
  community?: string;
  imageLimit: number;
}): Promise<DeveloperAssets | undefined> {
  const developer = input.developer.trim();
  if (!developer || /^(private|owner|landlord|seller)/i.test(developer)) {
    return undefined;
  }

  const page = await findProjectPage(input);
  if (!page) {
    // No page on the developer's own site — an open-web brochure may still
    // exist, and it is verified before it is ever served.
    for (const candidate of (await findBrochureCandidates(input)).slice(0, 6)) {
      const url = isSafePublicUrl(candidate);
      if (!url) continue;
      const buffer = await download(url, MAX_BROCHURE_BYTES);
      if (buffer && buffer.subarray(0, 5).toString("latin1") === "%PDF-") {
        return {
          sourcePage: url.toString(),
          brochure: { url: url.toString(), buffer, fromDeveloperSite: false },
          images: [],
        };
      }
    }
    return undefined;
  }

  const html = await fetch(page, {
    redirect: "follow",
    headers: { "user-agent": BROWSER_UA, accept: "text/html,*/*" },
    signal: AbortSignal.timeout(25_000),
  })
    .then((response) => (response.ok ? response.text() : undefined))
    .catch(() => undefined);
  if (!html) return undefined;

  const markup = decodeMarkup(html);

  // --- brochure -----------------------------------------------------------
  let brochure: DeveloperAssets["brochure"];
  const pdfUrls = extractUrls(markup, "pdf").sort((left, right) => {
    // A file named "brochure" beats a floor plan or terms sheet.
    const score = (value: string) => (/brochure/i.test(value) ? 0 : 1);
    return score(left) - score(right);
  });
  for (const candidate of pdfUrls.slice(0, 5)) {
    const url = isSafePublicUrl(candidate);
    if (!url) continue;
    const buffer = await download(url, MAX_BROCHURE_BYTES);
    // Trust the bytes, not the extension — a gated link returns an HTML page.
    if (buffer && buffer.subarray(0, 5).toString("latin1") === "%PDF-") {
      brochure = { url: url.toString(), buffer, fromDeveloperSite: true };
      break;
    }
  }

  // Brokers and portals mirror developer brochures, and their copy is often
  // the only one indexed. Those are worth trying when the developer's own site
  // yields nothing — but the file has to be checked for a broker's branding
  // before it reaches a buyer, so it is flagged as unverified here.
  if (!brochure) {
    for (const candidate of (await findBrochureCandidates(input)).slice(0, 6)) {
      const url = isSafePublicUrl(candidate);
      if (!url) continue;
      const buffer = await download(url, MAX_BROCHURE_BYTES);
      if (buffer && buffer.subarray(0, 5).toString("latin1") === "%PDF-") {
        brochure = { url: url.toString(), buffer, fromDeveloperSite: false };
        break;
      }
    }
  }

  // --- images -------------------------------------------------------------
  const imageUrls = extractUrls(markup, "jpg|jpeg|png|webp").sort(
    (left, right) => {
      // Hero and room renders first; logos and icons sink to the bottom.
      const score = (value: string) =>
        /hero|exterior|interior|render|gallery|amenit|facade|lifestyle/i.test(value)
          ? 0
          : /logo|icon|sprite|favicon|placeholder|avatar/i.test(value)
            ? 2
            : 1;
      return score(left) - score(right);
    },
  );

  const seen = new Set<string>();
  const images: DeveloperImage[] = [];
  const sharp = await loadSharp();
  // No image processing available: the brochure is still worth returning.
  for (const candidate of sharp ? imageUrls.slice(0, MAX_IMAGE_CANDIDATES) : []) {
    if (images.length >= input.imageLimit) break;
    const url = isSafePublicUrl(candidate);
    if (!url) continue;
    try {
      const raw = await download(url, MAX_IMAGE_BYTES);
      if (!raw) continue;
      const meta = await sharp!(raw).metadata();
      if ((meta.width ?? 0) < MIN_EDGE_PX || (meta.height ?? 0) < MIN_EDGE_PX / 2) {
        continue;
      }
      const digest = createHash("sha1").update(raw).digest("hex");
      if (seen.has(digest)) continue;
      seen.add(digest);

      const buffer = await sharp!(raw)
        .rotate()
        .resize({ width: 1800, withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      const out = await sharp!(buffer).metadata();
      images.push({
        buffer,
        width: out.width ?? 0,
        height: out.height ?? 0,
      });
    } catch {
      // Not a decodable image; skip it.
    }
  }

  if (!brochure && images.length === 0) return undefined;
  return { sourcePage: page, brochure, images };
}
