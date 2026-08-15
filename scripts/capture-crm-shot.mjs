/**
 * Captures the CRM board for the pitch deck.
 *
 * Seeds two realistic conversations through the public API first, so the board
 * shows a scored lead rather than an empty state, then signs in and shoots.
 * The seeded leads are cleaned up afterwards by the caller.
 */
import { chromium } from "playwright-core";

const BASE = process.env.PITCH_BASE ?? "https://realty-by-rahul.vercel.app";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const USER = process.env.CRM_ADMIN_USER ?? "rahul";
const PASS = process.env.CRM_ADMIN_PASSWORD ?? "RbR-Dubai-2026!";

async function say(visitorId, message) {
  await fetch(`${BASE}/api/crm/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, message }),
  });
}

// A hot buyer and a warm investor, so the board shows a real spread.
const a = "pitchdemo-ahmed";
await say(a, "hi");
await say(a, "I want to buy a 2 bedroom apartment in Dubai Marina, 3.5 million, cash, ready, moving within 30 days");
await say(a, "can I see it this week?");

const b = "pitchdemo-elena";
await say(b, "looking to invest, budget 2 million, off-plan in Dubai Creek Harbour, expecting 7% ROI, buying within 3 months");

console.log("seeded demo leads");

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

await page.goto(`${BASE}/crm/login`, { waitUntil: "networkidle" });
await page.fill("#user", USER);
await page.fill("#password", PASS);
await page.click('button[type="submit"]');
await page.waitForURL("**/crm", { timeout: 30_000 });
await page.waitForTimeout(2500);

await page.screenshot({ path: "public/pitch/crm-board.png" });
console.log("captured crm-board");

await page.screenshot({ path: "public/pitch/crm-board-full.png", fullPage: true });
console.log("captured crm-board-full");

await browser.close();
