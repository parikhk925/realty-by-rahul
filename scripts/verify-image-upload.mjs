import path from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.MANDEEP_BASE_URL ?? "http://localhost:3000";

async function verifyImageUpload() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${baseUrl}/listings?new=1`, { waitUntil: "networkidle" });
  await page
    .locator('input[type="file"][multiple]')
    .setInputFiles(path.join(process.cwd(), "public", "mandeep-profile.png"));
  await page.getByText("1 photo uploaded.", { exact: true }).waitFor({
    timeout: 45_000,
  });
  const imageUrl = await page.locator("#listing-images").inputValue();
  const result = {
    uploaded: imageUrl.startsWith("https://"),
    durableBlobUrl: imageUrl.includes(".public.blob.vercel-storage.com"),
    imageUrl,
    errors,
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();

  if (!result.uploaded || !result.durableBlobUrl || errors.length > 0) {
    throw new Error("Phone image upload verification failed.");
  }
}

verifyImageUpload().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
