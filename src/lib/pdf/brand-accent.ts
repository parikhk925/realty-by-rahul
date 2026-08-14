import "server-only";

/** The house gold, used whenever a brochure yields nothing usable. */
export const DEFAULT_ACCENT = "#a9822f";

/**
 * Reads an accent colour off the developer's own brochure cover.
 *
 * Every developer's brochure is already in the document, so the detail pages
 * that follow it can pick up its colour rather than sitting in one fixed
 * palette regardless of whose project it is — Emaar's olive-gold, Omniyat's
 * near-black, Damac's brass.
 *
 * Sampling is done on a MuPDF pixmap directly. sharp would be the obvious
 * tool and is deliberately avoided: its native binary is the one that failed
 * to load on the deployment platform, and colour on a cover page is not worth
 * reintroducing that risk for.
 */
export async function readBrandAccent(pdf: Buffer): Promise<string> {
  let mupdf: typeof import("mupdf");
  try {
    mupdf = await import("mupdf");
  } catch {
    return DEFAULT_ACCENT;
  }

  try {
    const doc = mupdf.Document.openDocument(new Uint8Array(pdf), "application/pdf");
    if (doc.countPages() === 0) return DEFAULT_ACCENT;

    const page = doc.loadPage(0);
    const [x0, y0, x1, y1] = page.getBounds();
    const width = x1 - x0;
    if (width <= 0) return DEFAULT_ACCENT;

    // A thumbnail is plenty — this is a colour question, not a detail one, and
    // it keeps the work to a few milliseconds.
    const scale = Math.min(160 / width, 1);
    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(scale, scale),
      mupdf.ColorSpace.DeviceRGB,
      false,
      true,
    );
    const pixels = pixmap.getPixels();
    const channels = pixmap.getNumberOfComponents();

    // Coarse buckets: near-identical shades should count as one colour rather
    // than splitting the vote between them.
    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
    for (let i = 0; i + channels - 1 < pixels.length; i += channels) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (!scorable(r, g, b)) continue;
      const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
      const entry = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      entry.count += 1;
      entry.r += r;
      entry.g += g;
      entry.b += b;
      buckets.set(key, entry);
    }

    page.destroy();
    pixmap.destroy();
    doc.destroy();

    let best: { count: number; r: number; g: number; b: number } | undefined;
    for (const entry of buckets.values()) {
      if (!best || entry.count > best.count) best = entry;
    }
    if (!best) return DEFAULT_ACCENT;

    return hex(
      Math.round(best.r / best.count),
      Math.round(best.g / best.count),
      Math.round(best.b / best.count),
    );
  } catch {
    return DEFAULT_ACCENT;
  }
}

/**
 * Only colours that can carry a heading on cream are counted.
 *
 * Brochure covers are mostly photography, so the raw dominant colour is
 * usually sky or grass — and near-white or near-black would be invisible or
 * indistinguishable from the body text. Requiring some saturation and a
 * mid-dark tone leaves the brand colour rather than the picture.
 */
function scorable(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  return luminance > 0.12 && luminance < 0.55 && saturation > 0.18;
}

function hex(r: number, g: number, b: number) {
  const clamp = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}
