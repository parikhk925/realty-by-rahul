# Realty by Rahul

A mobile-first Dubai property portfolio and agent workspace built with Next.js,
TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Vercel Blob and Supabase.

## Product areas

- `/` — agent dashboard and recent buyer activity
- `/listings` — off-plan, secondary and rental inventory
- `/collections` — one-link curated property collections
- `/agents` — admin-only team management and performance
- `/site-visits` — viewing schedule, statuses and visit targets
- `/profile` — advisor identity and account security
- `/listing/[slug]` — detailed property preview
- `/collection/[slug]` — customer collection experience

The property editor supports mobile photo uploads, a property brochure and one
optional floor-plan PDF. A PDF section is rendered publicly only when its file
was added to the property.

## Product rules

- Rental inventory is always ready for possession.
- Off-plan inventory supports handover dates and payment plans.
- Public pages do not expose property prices.
- Public enquiries route to the assigned agent, with Rahul as fallback.
- Developer and community names are remembered after a successful save.
- Agents can only access their owned listings, customers and site visits.
- Sample properties remain identified as demo inventory until verified.

## Local setup

Copy `.env.example` to `.env.local` and provide Vercel Blob and Supabase
credentials. Without Supabase credentials, the product runs in a safe preview
mode and account mutations remain disabled.

Apply the committed Supabase migration before enabling authentication:

```bash
npx supabase db push
```

Then start the app:

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run build
npm run verify:browser
```

## Deployment

Production: [realty-by-rahul.vercel.app](https://realty-by-rahul.vercel.app)

The `main` branch is connected to the Vercel project. Pushes to `main` trigger
production deployments; other branches create previews.
