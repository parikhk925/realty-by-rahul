import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MANDEEP_BASE_URL ?? "http://localhost:3000";
const outputDir = path.join(process.cwd(), "verification");

async function countErrorOverlays(page) {
  return page
    .locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    )
    .count();
}

async function verify() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const report = {
    dashboard: {},
    mobile: {},
    projects: {},
    whatsapp: {},
    publicProject: {},
    collections: {},
    profile: {},
  };

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  report.dashboard.title = await page.title();
  report.dashboard.hasGreeting =
    (await page.getByText("Good morning, Mandeep", { exact: false }).count()) ===
    1;
  report.dashboard.hasPortfolioHero =
    (await page.getByText(/Your Dubai/).count()) >= 1;
  report.dashboard.hasCategories =
    (await page.getByRole("tab", { name: "Off-plan" }).count()) === 1 &&
    (await page.getByRole("tab", { name: "Secondary" }).count()) === 1 &&
    (await page.getByRole("tab", { name: "Rent" }).count()) === 1;
  report.dashboard.errorOverlays = await countErrorOverlays(page);
  await page.screenshot({
    path: path.join(outputDir, "dashboard-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  // The bottom bar carries Home, Properties, Site visits and Profile around the
  // centre add button. Collections is reached from the dashboard on mobile.
  report.mobile.bottomNavigation =
    (await page.getByRole("navigation").getByText("Properties").count()) >= 1 &&
    (await page.getByRole("navigation").getByText("Site visits").count()) >= 1;
  report.mobile.addButton =
    (await page.getByRole("button", { name: "Add project" }).count()) === 1;
  await page.screenshot({
    path: path.join(outputDir, "dashboard-mobile.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/listings`, { waitUntil: "networkidle" });
  report.projects.categoryTabs =
    (await page.getByRole("button", { name: "Off-plan" }).count()) >= 1;
  report.projects.filterDropdown =
    (await page.getByRole("button", { name: /Filters/ }).count()) === 1;
  report.projects.mapToggle =
    (await page.getByRole("button", { name: "Map" }).count()) === 1;
  await page.getByRole("button", { name: /Filters/ }).click();
  report.projects.filterSubcategories =
    (await page.getByRole("combobox").count()) >= 5;
  await page.keyboard.press("Escape");

  await page
    .getByRole("main")
    .getByRole("button", { name: "Add project", exact: true })
    .click();
  const editor = page.getByRole("dialog");
  report.projects.editor =
    (await editor.getByText("Add a Dubai project", { exact: true }).count()) ===
    1;
  await editor.getByRole("combobox", { name: "Listing purpose" }).click();
  await page.getByRole("option", { name: "For rent" }).click();
  report.projects.rentReadyRule =
    (await editor
      .getByText("Ready for immediate possession", { exact: true })
      .count()) === 1 &&
    (await editor
      .getByRole("combobox", { name: "Construction status" })
      .count()) === 0;
  await editor.locator("#listing-title").fill("Verification Canal Home");
  await editor.locator("#listing-location").fill("Business Bay");
  await editor.locator("#listing-community").fill("Business Bay");
  await editor.locator("#listing-developer").fill("Private landlord");
  await editor.locator("#listing-price").fill("AED 160K / year");
  await editor.locator("#listing-payment-plan").fill("2 cheques");
  await editor.locator("#listing-area").fill("1,050 sq ft");
  // Projects default to draft, and a draft is never sent to a buyer, so set it
  // live before the sharing checks below.
  await editor.getByRole("combobox", { name: "Listing status" }).click();
  await page.getByRole("option", { name: "Publish live" }).click();
  await editor
    .getByRole("button", { name: "Add project", exact: true })
    .click();
  await page.getByText("Dubai project added.", { exact: true }).waitFor();
  report.projects.created =
    (await page
      .getByText("Verification Canal Home", { exact: true })
      .count()) === 1;
  report.projects.rentStoredReady = await page.evaluate(() => {
    const stored = window.localStorage.getItem(
      "mandeep-estates:properties:v1",
    );
    const project = stored
      ? JSON.parse(stored).find(
          (item) => item.title === "Verification Canal Home",
        )
      : undefined;
    return (
      project?.purpose === "For Rent" &&
      project?.constructionStatus === "Ready Possession" &&
      project?.possessionMonth === undefined &&
      project?.possessionYear === undefined
    );
  });

  await page
    .getByRole("checkbox", { name: "Select Verification Canal Home" })
    .check();
  await page
    .getByRole("checkbox", { name: "Select Business Bay Canal Loft" })
    .check();
  await page.route("**/api/projects/publish", async (route) => {
    const requestBody = route.request().postDataJSON();
    const slug = requestBody?.property?.slug ?? "published-project";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: `${baseUrl}/listing/${encodeURIComponent(slug)}`,
      }),
    });
  });
  await page.evaluate(() => {
    window.__mandeepWhatsAppUrl = "";
    window.open = (url) => {
      window.__mandeepWhatsAppUrl = String(url);
      return null;
    };
  });
  await page.getByRole("button", { name: /Share selection/ }).click();
  const shareDialog = page.getByRole("dialog");
  report.whatsapp.recipientDialog =
    (await shareDialog
      .getByText("Send directly on WhatsApp", { exact: true })
      .count()) === 1;
  await shareDialog
    .getByLabel("Buyer's WhatsApp number")
    .fill("056 539 1223");
  await shareDialog
    .getByRole("button", { name: "Continue to WhatsApp" })
    .click();
  await shareDialog
    .getByText("Share prepared", { exact: true })
    .waitFor();
  const whatsappUrl = await page.evaluate(() => window.__mandeepWhatsAppUrl);
  report.whatsapp.uaeRecipient =
    typeof whatsappUrl === "string" &&
    whatsappUrl.startsWith("https://wa.me/971565391223?text=");
  report.whatsapp.multipleProjects =
    decodeURIComponent(whatsappUrl).includes("Verification Canal Home") &&
    decodeURIComponent(whatsappUrl).includes("Business Bay Canal Loft");
  await shareDialog.getByRole("button", { name: "Done" }).click();
  await page.screenshot({
    path: path.join(outputDir, "properties-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `${baseUrl}/listing/bayview-residences-dubai-harbour`,
    { waitUntil: "networkidle" },
  );
  const publicBody = await page.locator("body").innerText();
  report.publicProject.title =
    (await page.getByText("Bayview Residences", { exact: true }).count()) >= 1;
  report.publicProject.priceHidden = !publicBody.includes("AED 1.59M");
  report.publicProject.bestOffer =
    (await page.getByRole("link", { name: /Get best offer/ }).count()) >= 1;
  const bestOfferHref = await page
    .getByRole("link", { name: /Get best offer/ })
    .first()
    .getAttribute("href");
  report.publicProject.agentWhatsApp =
    typeof bestOfferHref === "string" &&
    bestOfferHref.startsWith("https://wa.me/971565391223");
  report.publicProject.swipeControls =
    (await page.getByRole("button", { name: "Next image" }).count()) === 1;
  report.publicProject.errorOverlays = await countErrorOverlays(page);
  await page.screenshot({
    path: path.join(outputDir, "project-customer-mobile.png"),
    fullPage: true,
  });

  await page.goto(`${baseUrl}/collections`, { waitUntil: "networkidle" });
  report.collections.smartPresets =
    (await page.getByRole("button", { name: "Under AED 2M" }).count()) === 1;
  await page.getByRole("button", { name: "2028 handover" }).click();
  report.collections.presetSelection =
    (await page.getByText("matching properties selected.", { exact: false }).count()) ===
    1;
  report.collections.oneLinkActions =
    (await page.getByRole("button", { name: "Copy link" }).count()) >= 1 &&
    (await page.getByRole("button", { name: "WhatsApp" }).count()) === 1;

  await page.goto(
    `${baseUrl}/collection/off-plan-under-aed-2m`,
    { waitUntil: "networkidle" },
  );
  const collectionBody = await page.locator("body").innerText();
  report.collections.customerSwitcher =
    (await page.getByRole("button", { name: /Azure Creek/ }).count()) === 1;
  await page.getByRole("button", { name: /Azure Creek/ }).click();
  report.collections.switched =
    (await page.getByText("Azure Creek", { exact: true }).count()) >= 1;
  report.collections.priceHidden = !collectionBody.includes("AED 1.59M");
  await page.screenshot({
    path: path.join(outputDir, "collection-customer-mobile.png"),
    fullPage: true,
  });

  await page.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
  report.profile.identity =
    (await page.getByText("Mandeep's profile", { exact: true }).count()) === 1;
  report.profile.contact =
    (await page.getByText("+971 56 539 1223", { exact: true }).count()) >= 1;
  report.profile.compliance =
    (await page.getByText("DLD / RERA permit field", { exact: true }).count()) ===
    1;
  report.profile.errorOverlays = await countErrorOverlays(page);

  report.consoleErrors = consoleErrors;
  const checks = [
    report.dashboard.hasGreeting,
    report.dashboard.hasPortfolioHero,
    report.dashboard.hasCategories,
    report.dashboard.errorOverlays === 0,
    report.mobile.bottomNavigation,
    report.mobile.addButton,
    report.projects.categoryTabs,
    report.projects.filterDropdown,
    report.projects.filterSubcategories,
    report.projects.mapToggle,
    report.projects.editor,
    report.projects.rentReadyRule,
    report.projects.created,
    report.projects.rentStoredReady,
    report.whatsapp.recipientDialog,
    report.whatsapp.uaeRecipient,
    report.whatsapp.multipleProjects,
    report.publicProject.title,
    report.publicProject.priceHidden,
    report.publicProject.bestOffer,
    report.publicProject.agentWhatsApp,
    report.publicProject.swipeControls,
    report.publicProject.errorOverlays === 0,
    report.collections.smartPresets,
    report.collections.presetSelection,
    report.collections.oneLinkActions,
    report.collections.customerSwitcher,
    report.collections.switched,
    report.collections.priceHidden,
    report.profile.identity,
    report.profile.contact,
    report.profile.compliance,
    report.profile.errorOverlays === 0,
    consoleErrors.length === 0,
  ];

  console.log(JSON.stringify(report, null, 2));
  await context.close();
  await browser.close();
  if (checks.some((check) => !check)) {
    throw new Error("Browser verification failed. Inspect the report above.");
  }
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
