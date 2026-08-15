/**
 * Renders the pitch page to a print-ready PDF.
 *
 * Prints from the real page rather than rebuilding the document in a PDF
 * library, so the deck and the web version can never drift apart.
 *
 * Run: node scripts/build-pitch-pdf.mjs
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const BASE = process.env.PITCH_BASE ?? "http://localhost:3200";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = process.env.PITCH_OUT ?? "public/Kaivan-Tech-Lead-Qualification-Bot.pdf";

await mkdir("public", { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();

await page.goto(`${BASE}/pitch`, { waitUntil: "load", timeout: 90_000 });

// Fonts and the screenshot images must be fully settled or the print snapshot
// catches half-loaded artwork.
await page.evaluate(() => document.fonts?.ready);
await page.evaluate(async () => {
  await Promise.all(
    Array.from(document.images)
      .filter((img) => !img.complete)
      .map((img) => new Promise((res) => { img.onload = img.onerror = res; })),
  );
});
await page.waitForTimeout(2500);

await page.pdf({
  path: OUT,
  format: "A4",
  printBackground: true,
  margin: { top: "10mm", bottom: "12mm", left: "10mm", right: "10mm" },
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate: `
    <div style="width:100%;font-size:7.5px;color:#8b93a7;padding:0 12mm;
                font-family:Inter,Arial,sans-serif;display:flex;
                justify-content:space-between;">
      <span>Kaivan Tech — AI Lead Qualification Bot</span>
      <span>kaivantech.com · info@kaivantech.com</span>
      <span class="pageNumber"></span>
    </div>`,
});

await browser.close();
console.log("PDF written to", OUT);
