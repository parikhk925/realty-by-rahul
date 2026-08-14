# Mandeep Estates — Phase 1 Product Audit

Date: 27 July 2026
Scope: Dubai agent dashboard, property catalogue, listing editor, collections, buyer pages, WhatsApp sharing, profile, and responsive navigation.

## Executive summary

Phase 1 is a mobile-first personal property portfolio for Mandeep, rebuilt from the latest PropFlow v2 foundation and restructured for the Dubai market. The interface uses a light ivory, sky-blue, and warm-gold visual system with restrained glass effects. It does not include the marketing site, authentication, CRM, billing, or Phase 2 integrations.

The product supports the full prototype workflow:

- manage Off-plan, Secondary, and Rental inventory;
- filter by Dubai community, budget, bedrooms, property type, and handover;
- create and edit Dubai listings with payment plans and phone-friendly image uploads;
- enforce ready possession for rental listings;
- select one or several properties and prepare a WhatsApp share;
- build curated collections and send them as one clean link;
- show buyer-facing property and collection pages without public prices;
- route every “Get best offer” enquiry to Mandeep’s WhatsApp number;
- present trust information without claiming an unverified DLD/RERA credential.

## Requirement audit

| Requirement | Authoritative evidence | Result |
| --- | --- | --- |
| Separate `pf-mandeep` product | Independent worktree, package name, storage namespaces, and brand metadata | Passed |
| Latest PropFlow v2 foundation | New worktree created from source commit `f8930f8` before the Dubai rebuild | Passed |
| Reference-inspired UI | Dashboard includes branded header, greeting, portfolio hero, metrics, inventory tabs, quick actions, featured project, enquiries, and mobile bottom navigation | Passed |
| Mobile-first navigation | Automated viewport test verifies header, primary actions, and bottom navigation at 390 × 844 | Passed |
| Dubai inventory model | Seed data and editor cover Dubai communities, AED, developers, payment plans, handover, Off-plan, Secondary, and Rent | Passed |
| Sensible rental rules | Creation flow normalizes rental listings to Ready possession | Passed |
| Dropdown filters | Filter subcategories remain hidden until the filter popover is opened | Passed |
| Multi-property WhatsApp | Catalogue selection and recipient flow are verified | Passed |
| Short buyer links | Project and collection publish APIs use Vercel Blob-backed snapshots | Passed locally; production storage verified after deployment |
| Buyer price privacy | Automated buyer-page checks confirm public prices are not rendered | Passed |
| Buyer best-offer CTA | Automated checks confirm the CTA targets `971565391223` with a prefilled message | Passed |
| Premium galleries | Touch swipe, translucent controls, dots, thumbnails, and collection switching are present | Passed |
| Trust controls | Demo inventory is labelled and DLD/RERA data is never fabricated | Passed |
| Code quality | ESLint, TypeScript/Next production build, and browser verification | Passed |

## Verification performed

Commands:

```bash
npm run lint
npm run build
npm audit --omit=dev
npm run verify:browser
npm run verify:mobile
```

The browser verifier exercised:

1. dashboard hierarchy and navigation;
2. mobile navigation and central add action;
3. dropdown filters, map preview, and listing editor;
4. new project creation and rental possession normalization;
5. UAE and international WhatsApp recipient formatting;
6. multi-property sharing;
7. buyer property page, hidden price, gallery, and WhatsApp CTA;
8. smart collection creation, one-link preview, switching, and hidden prices;
9. agent profile and compliance disclosure.

The dedicated mobile verifier also runs at a 430 × 720 visible viewport to
simulate an iPhone 14 Pro Max with Chrome controls expanded. It verifies:

- the property editor remains open after route navigation;
- the close and cancel actions stay inside the viewport;
- the action footer remains visible after scrolling the complete form;
- lead rows, the all-leads view, WhatsApp actions, and notifications work.

Latest result: all assertions passed with zero browser console errors.

## Production notes

- Public project snapshots, public collection snapshots, and direct image uploads require a Vercel Blob store connected to the production project.
- `NEXT_PUBLIC_APP_URL` should match the production domain if a custom domain is added.
- Inventory is prototype data until Mandeep replaces it with verified listings and permit information.
- Madmoun QR verification, live portal feeds, analytics, CRM, and automation remain intentionally outside Phase 1.

## Dependency audit

`npm audit --omit=dev` reports zero production vulnerabilities. The full development dependency tree currently reports issues inside the ESLint/minimatch toolchain; they do not ship in the production bundle and should be revisited when the compatible upstream ESLint packages are updated.
