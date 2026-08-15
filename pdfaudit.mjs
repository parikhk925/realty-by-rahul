import { getDocumentProxy } from "unpdf";
import { readFile } from "node:fs/promises";
const buf = await readFile(process.argv[2]);
const pdf = await getDocumentProxy(new Uint8Array(buf));
console.log("PAGES:", pdf.numPages, "\n");
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const c = await page.getTextContent();
  const items = c.items.filter(x => x.str.trim());
  const text = items.map(x => x.str).join(" ").replace(/\s+/g, " ").trim();
  const body = text.replace(/Kaivan Tech — AI Lead Qualification Bot.*$/, "").trim();
  const chars = body.length;
  const flag = chars < 120 ? "  <-- SPARSE" : "";
  console.log(`p${String(i).padStart(2)} | ${String(chars).padStart(4)} chars | ${body.slice(0, 95)}${flag}`);
}
