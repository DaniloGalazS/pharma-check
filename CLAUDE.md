# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PharmaCheck — web app to search and compare medication prices across Chilean pharmacies (Cruz Verde, Salcobrand, Ahumada, Farmacias Similares) using public APIs and web scraping.

**Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, Prisma ORM, Supabase (PostgreSQL), NextAuth.js, Playwright.

## Commands

> This project has not been scaffolded yet. Update this section once `npm create next-app` is run.

Expected commands once set up:

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Unit/integration tests (Jest or Vitest)
npx playwright test  # E2E tests
npx prisma migrate dev   # Run DB migrations
npx prisma studio        # Open DB GUI
```

## Architecture

### Data flow
Scrapers (cron jobs on Railway) → PostgreSQL (Supabase) → Next.js API routes → React UI

### Key directories (planned)
- `app/` — Next.js App Router pages and layouts
- `app/api/` — API routes (search, prices, alerts, auth)
- `components/` — Shared UI components
- `lib/scrapers/` — One scraper per pharmacy chain (Cruz Verde, Salcobrand, Ahumada, Similares)
- `lib/minsal/` — MINSAL Farmanet API client and Tu Farmacia data sync
- `lib/db/` — Prisma client and query helpers
- `prisma/` — Schema and migrations

### Data sources
- **Farmanet MINSAL** (`midas.minsal.cl`) — pharmacy locations and on-duty pharmacies (public REST API)
- **Tu Farmacia MINSAL** — official price catalog (~12,000 medications)
- **Web scrapers** — Cruz Verde, Salcobrand, Ahumada, Farmacias Similares (no public API; use Playwright/Puppeteer)
- **datos.gob.cl** — open dataset of Chilean pharmacies

### Database schema (core tables)
`medications`, `prices`, `pharmacies`, `users`, `favorites`, `price_alerts`

Prices are refreshed every ~6 hours via cron. The `prices` table keeps history to power the price chart on medication detail pages.

### Auth
NextAuth.js with email/password and Google OAuth. Protected routes use Next.js middleware.

### Notifications
Email alerts via Resend/SendGrid when a medication price drops below a user-defined threshold. Optional web push via service workers.
