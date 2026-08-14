import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MANDEEP_BASE_URL ?? "http://localhost:3002";
const outputDir = path.join(process.cwd(), "verification");
let activeBrowser;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function isInsideViewport(locator, viewport) {
  const box = await locator.boundingBox();
  return Boolean(
    box &&
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= viewport.width &&
      box.y + box.height <= viewport.height,
  );
}

async function verifyMobileActions() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  activeBrowser = browser;
  const context = await browser.newContext({
    viewport: { width: 430, height: 720 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const report = {
    addProject: {},
    propertyEditor: {},
    leads: {},
    notifications: {},
    consoleErrors,
  };

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const firstLead = page.getByRole("button", {
    name: /Open enquiry from Aisha Al Mansoori/,
  });
  await firstLead.click();
  const leadTitle = page.getByRole("heading", { name: "Enquiry details" });
  await leadTitle.waitFor();
  report.leads.rowOpens = await leadTitle.isVisible();
  report.leads.whatsAppAction = await page
    .getByRole("link", { name: "WhatsApp" })
    .isVisible();
  report.leads.budgetVisible = await page.getByText("AED 2.5M–3.2M").isVisible();
  await page.screenshot({
    path: path.join(outputDir, "iphone-lead-details.png"),
  });
  await page.getByRole("button", { name: "Close enquiries" }).click();

  await page.getByRole("button", { name: /View all/ }).click();
  report.leads.viewAllOpens =
    (await page.getByRole("heading", { name: "All enquiries" }).count()) === 1;
  await page
    .getByRole("button", { name: /Omar Hassan/, exact: false })
    .click();
  report.leads.listSelectionOpens =
    (await page.getByText("+971 55 234 5678").count()) === 1;
  await page.getByRole("button", { name: "Close enquiries" }).click();

  await page.getByRole("button", { name: "Open notifications" }).click();
  report.notifications.opens = await page
    .getByText("New best-offer enquiry")
    .isVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Add project" }).click();
  await page.waitForURL(/\/listings\?new=1/);
  const editorTitle = page.getByRole("heading", { name: "Add a Dubai project" });
  await editorTitle.waitFor();
  await page.waitForTimeout(1800);
  report.addProject.staysOpen = await editorTitle.isVisible();

  const closeButton = page.getByRole("button", {
    name: "Close property editor",
  });
  report.propertyEditor.closeVisible = await closeButton.isVisible();
  report.propertyEditor.closeInsideViewport = await isInsideViewport(closeButton, {
    width: 430,
    height: 720,
  });
  await page.screenshot({
    path: path.join(outputDir, "iphone-editor-top.png"),
  });

  const scrollArea = page.locator(
    '[data-slot="dialog-content"] [class*="overflow-y-auto"]',
  );
  await scrollArea.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const cancelButton = page.getByRole("button", { name: "Cancel" });
  report.propertyEditor.cancelVisible = await cancelButton.isVisible();
  report.propertyEditor.cancelInsideViewport = await isInsideViewport(
    cancelButton,
    { width: 430, height: 720 },
  );
  report.propertyEditor.footerStickyAfterScroll =
    (await cancelButton.boundingBox())?.y > 620;
  await page.screenshot({
    path: path.join(outputDir, "iphone-editor-bottom.png"),
  });
  await cancelButton.click();
  await page.waitForURL(`${baseUrl}/listings`);
  report.propertyEditor.cancelCloses =
    (await page.getByRole("heading", { name: "Add a Dubai project" }).count()) ===
    0;

  await page.getByRole("button", { name: "Add project" }).click();
  await editorTitle.waitFor();
  await page.waitForTimeout(1800);
  report.addProject.sameRouteStaysOpen = await editorTitle.isVisible();
  await closeButton.click();
  report.propertyEditor.closeCloses =
    (await page.getByRole("heading", { name: "Add a Dubai project" }).count()) ===
    0;

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Add project" }).click();
  await editorTitle.waitFor();
  await page.waitForTimeout(1800);
  report.addProject.quickActionStaysOpen = await editorTitle.isVisible();
  await closeButton.click();

  report.errorOverlays = await page
    .locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    )
    .count();

  assert(report.leads.rowOpens, "Lead row did not open enquiry details.");
  assert(report.leads.whatsAppAction, "Lead WhatsApp action is missing.");
  assert(report.leads.budgetVisible, "Lead context is missing.");
  assert(report.leads.viewAllOpens, "View all enquiries did not open.");
  assert(report.leads.listSelectionOpens, "Lead list selection did not open.");
  assert(report.notifications.opens, "Notifications did not open.");
  assert(report.addProject.staysOpen, "Add project closed after navigation.");
  assert(
    report.addProject.sameRouteStaysOpen,
    "Add project closed when opened from the listings route.",
  );
  assert(
    report.addProject.quickActionStaysOpen,
    "Dashboard quick action closed the property editor.",
  );
  assert(
    report.propertyEditor.closeInsideViewport,
    "Editor close button is outside the mobile viewport.",
  );
  assert(
    report.propertyEditor.cancelInsideViewport,
    "Editor cancel button is outside the mobile viewport.",
  );
  assert(report.propertyEditor.cancelCloses, "Cancel did not close the editor.");
  assert(report.propertyEditor.closeCloses, "Close did not close the editor.");
  assert(report.errorOverlays === 0, "A framework error overlay was detected.");
  assert(consoleErrors.length === 0, "Browser console errors were detected.");

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  activeBrowser = undefined;
}

verifyMobileActions().catch(async (error) => {
  console.error(error);
  if (activeBrowser) await activeBrowser.close();
  process.exitCode = 1;
});
