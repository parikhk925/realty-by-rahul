/**
 * Builds the sample project pack and floor plan shipped with each seed
 * listing, so the document downloads on the listing page have real files
 * behind them before any developer PDF has been uploaded.
 *
 * Deliberately authored as "prepared by Realty by Rahul" and watermarked as a
 * sample: these are not the developers' own brochures and must never look like
 * an Emaar or Nakheel document.
 *
 * Run: node scripts/build-sample-docs.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const NAVY = rgb(0.05, 0.12, 0.2);
const GOLD = rgb(0.82, 0.64, 0.34);
const GREY = rgb(0.42, 0.48, 0.55);
const LIGHT = rgb(0.9, 0.93, 0.96);

// Read straight from the seed file's extracted data, so adding inventory
// does not mean hand-maintaining a second list here.
const LISTINGS = JSON.parse(
  await readFile(new URL("./_listings.json", import.meta.url), "utf8"),
);

function header(page, font, bold, title, kicker) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: NAVY });
  page.drawText("REALTY BY RAHUL", { x: 48, y: height - 52, size: 16, font: bold, color: GOLD });
  page.drawText(kicker, { x: 48, y: height - 74, size: 9, font, color: rgb(0.75, 0.8, 0.86) });
  page.drawText(title.slice(0, 52), { x: 48, y: height - 102, size: 15, font: bold, color: rgb(1, 1, 1) });
}

function footer(page, font) {
  const { width } = page.getSize();
  page.drawLine({ start: { x: 48, y: 60 }, end: { x: width - 48, y: 60 }, thickness: 0.75, color: LIGHT });
  page.drawText("Sample document — figures are indicative and confirmed per unit before commitment.", {
    x: 48, y: 44, size: 7.5, font, color: GREY,
  });
  page.drawText("Rahul Jakhar · Dubai Real Estate Advisor · wa.me/message/7MQC2TXBOY3YO1", {
    x: 48, y: 32, size: 7.5, font, color: GREY,
  });
}

async function buildBrochure(listing) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { height } = page.getSize();

  header(page, font, bold, listing.title, "PROJECT INFORMATION PACK");

  let y = height - 170;
  page.drawText("Overview", { x: 48, y, size: 13, font: bold, color: NAVY });
  y -= 22;
  for (const line of [
    `${listing.community}, Dubai.`,
    `${listing.beds === 0 ? "Studio" : listing.beds + " bedroom"} · ${listing.baths} bathroom · ${listing.area}.`,
    "Prepared for buyers reviewing this unit with Realty by Rahul.",
  ]) {
    page.drawText(line, { x: 48, y, size: 10, font, color: rgb(0.2, 0.26, 0.33) });
    y -= 16;
  }

  y -= 18;
  page.drawText("What this pack covers", { x: 48, y, size: 13, font: bold, color: NAVY });
  y -= 22;
  for (const item of [
    "Unit specification and layout summary",
    "Payment structure and handover position",
    "Community amenities and connectivity",
    "Service charge and ownership basis",
    "Next steps: viewing, offer and transfer",
  ]) {
    page.drawCircle({ x: 52, y: y + 3, size: 2, color: GOLD });
    page.drawText(item, { x: 62, y, size: 10, font, color: rgb(0.2, 0.26, 0.33) });
    y -= 17;
  }

  y -= 18;
  page.drawRectangle({ x: 48, y: y - 62, width: 499, height: 74, color: rgb(0.97, 0.98, 0.99) });
  page.drawText("Before you commit", { x: 62, y: y - 6, size: 10.5, font: bold, color: NAVY });
  page.drawText("Availability, pricing and incentives move quickly in Dubai. Every figure here is", {
    x: 62, y: y - 24, size: 9, font, color: GREY,
  });
  page.drawText("confirmed in writing against the specific unit before any payment is made.", {
    x: 62, y: y - 38, size: 9, font, color: GREY,
  });

  footer(page, font);
  return doc.save();
}

async function buildFloorPlan(listing) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { height } = page.getSize();

  header(page, font, bold, listing.title, "INDICATIVE FLOOR PLAN");

  // A simple schematic: outer envelope plus room divisions scaled to the brief.
  const x0 = 90, y0 = 300, w = 415, h = 340;
  page.drawRectangle({ x: x0, y: y0, width: w, height: h, borderColor: NAVY, borderWidth: 1.5 });

  const rooms = listing.beds === 0
    ? [["Living / sleeping", 0, 0, 0.62, 1], ["Bath", 0.62, 0, 0.38, 0.42], ["Kitchen", 0.62, 0.42, 0.38, 0.58]]
    : [
        ["Living / dining", 0, 0, 0.55, 0.62],
        ["Kitchen", 0, 0.62, 0.55, 0.38],
        ["Primary bed", 0.55, 0, 0.45, 0.5],
        [listing.beds > 1 ? "Bedroom 2" : "Study", 0.55, 0.5, 0.45, 0.5],
      ];

  for (const [label, rx, ry, rw, rh] of rooms) {
    const rX = x0 + rx * w, rY = y0 + ry * h, rW = rw * w, rH = rh * h;
    page.drawRectangle({ x: rX, y: rY, width: rW, height: rH, borderColor: rgb(0.7, 0.76, 0.83), borderWidth: 0.75 });
    page.drawText(label, { x: rX + 10, y: rY + rH - 18, size: 8.5, font: bold, color: rgb(0.25, 0.32, 0.4) });
  }

  page.drawText(`Total area: ${listing.area}`, { x: x0, y: y0 - 26, size: 10, font: bold, color: NAVY });
  page.drawText("Not to scale. Dimensions are indicative and subject to final survey.", {
    x: x0, y: y0 - 42, size: 8.5, font, color: GREY,
  });

  footer(page, font);
  return doc.save();
}

await mkdir("public/docs", { recursive: true });

for (const listing of LISTINGS) {
  await writeFile(`public/docs/${listing.slug}-brochure.pdf`, await buildBrochure(listing));
  await writeFile(`public/docs/${listing.slug}-floor-plan.pdf`, await buildFloorPlan(listing));
  console.log("built", listing.slug);
}

console.log(`\n${LISTINGS.length * 2} documents written to public/docs/`);
