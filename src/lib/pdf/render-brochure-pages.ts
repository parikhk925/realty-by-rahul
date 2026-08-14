import "server-only";

export interface RenderedPage {
  buffer: Buffer;
  width: number;
  height: number;
  /** 1-based, so the listing gallery can keep the brochure's own order. */
  page: number;
}

/**
 * Long edge of the rendered image. A brochure page at its native scale comes
 * out around 2500x3500 and over a megabyte, which is far heavier than a
 * listing photo needs to be; 1600 keeps the type on a page legible while
 * landing around 180KB.
 */
const TARGET_EDGE_PX = 1600;
const JPEG_QUALITY = 78;

/**
 * Renders the first pages of a brochure as images, in the brochure's own order.
 *
 * The alternative — pulling the JPEGs already embedded in the PDF — returns the
 * developer's renders without the layout around them, in whatever order the
 * file happens to store them, and misses anything drawn rather than placed.
 * Rendering each page gives back exactly the spread a buyer would see.
 *
 * MuPDF here is WebAssembly, not a native module. That is the point: sharp's
 * native binary could not be loaded on the deployment platform and took a whole
 * route down with it. WASM is the same bytes everywhere, so there is no build
 * host or architecture for it to disagree with. It is still imported lazily and
 * failure is still non-fatal — page images are worth having, not worth losing
 * the brochure over.
 */
export async function renderBrochurePages(
  pdf: Buffer,
  limit: number,
): Promise<RenderedPage[]> {
  if (limit <= 0) return [];

  let mupdf: typeof import("mupdf");
  try {
    mupdf = await import("mupdf");
  } catch {
    return [];
  }

  let doc: ReturnType<typeof mupdf.Document.openDocument>;
  try {
    doc = mupdf.Document.openDocument(new Uint8Array(pdf), "application/pdf");
  } catch {
    return [];
  }

  const pages: RenderedPage[] = [];
  const count = Math.min(doc.countPages(), limit);

  for (let index = 0; index < count; index += 1) {
    let page;
    let pixmap;
    try {
      page = doc.loadPage(index);
      const [x0, y0, x1, y1] = page.getBounds();
      const width = x1 - x0;
      const height = y1 - y0;
      if (width <= 0 || height <= 0) continue;

      // Scale from the page's own size so portrait and landscape brochures
      // both come back at a sensible edge length. Capped so a small page
      // cannot be blown up into something enormous.
      const scale = Math.min(TARGET_EDGE_PX / Math.max(width, height), 3);

      pixmap = page.toPixmap(
        mupdf.Matrix.scale(scale, scale),
        mupdf.ColorSpace.DeviceRGB,
        false,
        true,
      );
      const jpeg = pixmap.asJPEG(JPEG_QUALITY, false);
      pages.push({
        buffer: Buffer.from(jpeg),
        width: pixmap.getWidth(),
        height: pixmap.getHeight(),
        page: index + 1,
      });
    } catch {
      // A page that will not render should not cost us the rest of them.
    } finally {
      // The WASM heap is not garbage collected for us, and a warm serverless
      // instance renders many brochures over its life.
      pixmap?.destroy();
      page?.destroy();
    }
  }

  doc.destroy();
  return pages;
}
