import { getDocumentProxy } from "unpdf";
import { readFile } from "node:fs/promises";
const buf = await readFile(process.argv[2]);
const pdf = await getDocumentProxy(new Uint8Array(buf));
console.log("pages:", pdf.numPages);
for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
  const page = await pdf.getPage(i);
  const c = await page.getTextContent();
  const s = c.items.map(it => it.str).join(" ").replace(/\s+/g," ").trim();
  console.log(`\n[p${i}] ${s.slice(0,180)}`);
}
