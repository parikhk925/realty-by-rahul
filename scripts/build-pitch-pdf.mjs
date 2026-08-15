/**
 * Renders the pitch page to a print-ready PDF.
 *
 * Prints the real page rather than rebuilding the document in a PDF library,
 * so the deck and the web version can never drift apart.
 *
 * Run: node scripts/build-pitch-pdf.mjs
 */
import { chromium } from "playwright-core";

const BASE = process.env.PITCH_BASE ?? "https://realty-by-rahul.vercel.app";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = process.env.PITCH_OUT ?? "public/Kaivan-Tech-Lead-Qualification-Bot.pdf";

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });

console.log("loading", `${BASE}/pitch`);
await page.goto(`${BASE}/pitch`, { waitUntil: "domcontentloaded", timeout: 60_000 });

// Scroll the whole document so lazily-loaded images decode before printing.
await page.evaluate(() => {
  return new Promise((resolve) => {
    let y = 0;
    const step = () => {
      y += 600;
      window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(step, 60);
      else { window.scrollTo(0, 0); resolve(); }
    };
    step();
  });
});
console.log("scrolled");

await page.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});
await page.waitForTimeout(6000);
console.log("printing");

await page.pdf({
  path: OUT,
  format: "A4",
  printBackground: true,
  margin: { top: "10mm", bottom: "12mm", left: "10mm", right: "10mm" },
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate:
    '<div style="width:100%;font-size:7.5px;color:#8b93a7;padding:0 12mm;' +
    'font-family:Arial,sans-serif;display:flex;justify-content:space-between;">' +
    "<span>Kaivan Tech — AI Lead Qualification Bot</span>" +
    "<span>kaivantech.com · info@kaivantech.com</span>" +
    '<span class="pageNumber"></span></div>',
});

await browser.close();
console.log("PDF written to", OUT);
