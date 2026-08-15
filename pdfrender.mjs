import * as mupdf from "mupdf";
import { readFile, writeFile } from "node:fs/promises";
const buf = await readFile(process.argv[2]);
const doc = mupdf.Document.openDocument(new Uint8Array(buf), "application/pdf");
for (const n of process.argv.slice(3).map(Number)) {
  const page = doc.loadPage(n - 1);
  const pix = page.toPixmap(mupdf.Matrix.scale(1.4, 1.4), mupdf.ColorSpace.DeviceRGB, false, true);
  await writeFile(`/tmp/pdf-p${n}.png`, pix.asPNG());
  console.log("rendered p" + n);
}
