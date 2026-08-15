/**
 * Captures the product screenshots used in the pitch deck.
 *
 * Runs against the live deployment with Chrome, so the images are the real
 * interface rather than a mockup that will drift out of date.
 *
 * Run: node scripts/capture-pitch-shots.mjs
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const BASE = process.env.PITCH_BASE ?? "https://realty-by-rahul.vercel.app";
const OUT = "public/pitch";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

/** The intro plays once per session; mark it seen so shots are of the page itself. */
async function skipIntro() {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("realty-by-rahul:intro-seen", "1");
    } catch {}
  });
}
await skipIntro();

async function shot(name, { url, wait = 2500, full = false, before } = {}) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(wait);
  if (before) await before();
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log("captured", name);
}

// 1. Public site hero
await shot("site-hero", { url: "/" });

// 2. Portfolio grid
await shot("site-portfolio", {
  url: "/",
  before: async () => {
    await page.evaluate(() => {
      document.getElementById("portfolio")?.scrollIntoView();
    });
    await page.waitForTimeout(1200);
  },
});

// 3. Listing detail
await shot("site-listing", { url: "/listing/marina-vista-2br-emaar-beachfront" });

// 4. The assistant mid-conversation
await shot("chat-widget", {
  url: "/",
  wait: 1500,
  before: async () => {
    await page.click('button[aria-label*="assistant"]');
    await page.waitForTimeout(900);
    const send = async (text) => {
      await page.fill('input[placeholder="Type a message…"]', text);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2600);
    };
    await send("hi");
    await send("buy a 2 bedroom apartment in Dubai Marina, 3.5 million, cash, ready, within 30 days");
    await page.waitForTimeout(1200);
  },
});

await browser.close();
console.log("\nDone.");
