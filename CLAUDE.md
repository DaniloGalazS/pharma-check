# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PharmaCheck — web app to search and compare medication prices across Chilean pharmacies (Cruz Verde, Salcobrand, Ahumada, Farmacias Similares) using public APIs and web scraping.

**Stack:** Next.js 16 (App Router) + TypeScript 5, Tailwind CSS v4, Prisma 7 ORM, Supabase (PostgreSQL), NextAuth.js v5, Playwright.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier (format all files)
npm test             # Unit/integration tests (not yet configured)
npx playwright test  # E2E tests (not yet configured)
npm run db:migrate   # prisma migrate dev
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:push      # Push schema changes to DB without migration
```

## Architecture

### Data flow
Scrapers (cron jobs on Railway) → PostgreSQL (Supabase) → Next.js API routes → React UI

### Key directories
- `src/app/` — Next.js App Router pages and layouts
- `src/app/api/` — API routes (search, prices, alerts, auth)
- `src/components/` — Shared UI components (ui/, layout/, search/, medications/, pharmacies/)
- `src/lib/scrapers/` — One scraper per pharmacy chain (Cruz Verde, Salcobrand, Ahumada, Similares)
- `src/lib/minsal/` — MINSAL Farmanet API client and Tu Farmacia data sync
- `src/lib/db/` — Prisma client singleton (`prisma.ts`)
- `src/types/` — Shared TypeScript types
- `prisma/` — Schema and migrations
- `.github/workflows/` — CI/CD (lint, typecheck, build)

### Prisma 7 notes
- Prisma 7 removed `url` from `datasource` in `schema.prisma`. Connection URL goes in `prisma.config.ts`.
- PrismaClient uses the `@prisma/adapter-pg` driver adapter — pass `adapter` to constructor.
- Run `npm run db:generate` after any schema change.

### Data sources
- **Farmanet MINSAL** (`midas.minsal.cl`) — pharmacy locations and on-duty pharmacies (public REST API)
- **Tu Farmacia MINSAL** — official price catalog (~12,000 medications)
- **Web scrapers** — Cruz Verde, Salcobrand, Ahumada, Farmacias Similares (no public API; use Playwright)
- **datos.gob.cl** — open dataset of Chilean pharmacies

### Database schema (core tables)
`Medication`, `Price` (time-series), `Pharmacy`, `User`, `Account`, `Session`, `Favorite`, `PriceAlert`, `SearchHistory`, `ScraperRun`

Prices are refreshed every ~6 hours via cron. The `prices` table keeps history for price charts.

### Auth
NextAuth.js v5 with email/password and Google OAuth. Protected routes use Next.js middleware.

### Notifications
Email alerts via Resend when a medication price drops below a user-defined threshold.

## Environment variables
Copy `.env.example` → `.env` and fill in:
- `DATABASE_URL` — Supabase connection string (pooled via PgBouncer)
- `AUTH_SECRET` — generate with `npx auth secret`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials
- `RESEND_API_KEY` — for email alerts
