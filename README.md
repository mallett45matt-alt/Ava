# Ava

Ava is an all-in-one business hub for small trade and field-service businesses —
landscapers, gardeners, electricians, plumbers, cleaners, painters and similar
operators. Customers, jobs, a calendar, quotes and invoices in one calm, simple
app, with an AI assistant (Ava) that helps you stay on top of it all.

This document explains how the app is put together and how to run it. It's
written for a non-technical reader as much as a developer — if a term needs
explaining, it's explained.

## How it's built, in plain English

**One app, not several.** Ava is built with [Next.js](https://nextjs.org), a
framework that lets a single project serve both the web pages you see and the
backend logic that reads/writes the database. That means one codebase, one
thing to deploy, and no separate API server to babysit.

**A proper database, not spreadsheets.** All data lives in
[PostgreSQL](https://www.postgresql.org/), the industry-standard open-source
database. We talk to it through [Prisma](https://www.prisma.io/), a tool that
lets the whole data model live in one readable file
(`prisma/schema.prisma`) and generates safe, typed code to query it — so
there's one source of truth for "what does a Job look like."

**Every business only ever sees its own data.** The app is multi-tenant: many
businesses share the same running app and database, but each one is walled
off. Every table that holds business data (customers, jobs, quotes, invoices,
tasks…) has a `businessId` column, and every single database query goes
through helper functions that filter by "the business the logged-in person
belongs to" (see `src/server/auth/require.ts` and the files under
`src/server/data/`). That's the one place tenant isolation is enforced, so
it can't be accidentally forgotten in some other corner of the app.

**Accounts, kept simple.** Log in is email + password (no third-party
"Sign in with Google" complexity for V1). Signing up creates a *Business*
plus an *Owner* account. Passwords are hashed with bcrypt and never stored in
plain text. A signed, `httpOnly` cookie carries the session — see
`src/server/auth/`.

**Ava (the AI) only gets a locked-down toolbox.** Ava never gets raw access
to the database. She's given a fixed list of functions she's allowed to call
(e.g. `getTodaysJobs`, `getOutstandingInvoices`, `createTask`), each of which
is already scoped to your business. Reading data happens immediately;
creating or changing data always comes back as "here's what I'd do — confirm?"
first. See `src/server/ava/` (added once the AI layer is built).

**Money is stored as cents**, e.g. $45.50 is stored as the integer `4550`.
This avoids floating-point rounding bugs and a technical headache Prisma's
`Decimal` type causes when passing values from the server to the browser.

## Project structure

```
prisma/schema.prisma      The entire data model, in one file.
src/
  app/                    Pages and layouts (Next.js "App Router").
    (app)/                Everything behind login: dashboard, calendar,
                           customers, money (quotes+invoices), tasks, settings.
    login/, signup/       Public auth pages.
    page.tsx              Public landing page.
  components/
    ui/                   Small reusable building blocks (Button, Card, Input...).
    shell/                The app's navigation (sidebar on desktop, bottom
                           tab bar on mobile).
    forms/                A generic Server Action <-> form helper.
    <feature>/             Feature-specific UI (settings, customers, ...).
  server/
    auth/                 Login/signup/session/tenant-scoping.
    db/client.ts           The single shared Prisma client.
    data/                 One file per feature: reads (e.g. `customers.ts`)
                           and, in a matching `-actions.ts` file, the
                           Server Actions that change data (creates/updates).
    ava/                  The AI assistant's tools and reasoning (added later).
  lib/                    Formatting helpers, small utilities.
  middleware → proxy.ts   Redirects signed-out visitors to /login and signed-in
                           visitors away from /login and /signup (Next.js 16
                           renamed "middleware" to "proxy").
```

**Why data is split into `thing.ts` + `thing-actions.ts`:** Next.js draws a
hard line between code that only ever runs on the server (safe to use a
database, secrets, etc.) and code that can run in the visitor's browser.
Read-only functions live in the plain file and are only ever called from
Server Components (pages). Anything a button click or form submit needs to
trigger — a Server Action — lives in the `-actions.ts` file with a `"use
server"` marker at the top, which is what makes it safely callable from
interactive, client-side UI.

## Data model

Everything hangs off `Business`. Each business has `User`s (people who log
in) and `StaffMember`s (people jobs can be assigned to — deliberately a
separate, simpler concept, since most crews have people who do the work but
never need to log into the software). From there:

- **Customer** — the central record: contact details, notes, and (through
  relations) their job history, upcoming jobs, recurring services, quotes and
  invoices.
- **Job** — a single visit: customer, address, date/time, duration,
  description, assigned staff member, status (Scheduled / In progress /
  Completed / Cancelled), internal notes, price.
- **RecurringJob** — a template ("mow every 3 weeks") that generates real
  `Job` rows on a schedule.
- **Quote** and **QuoteItem** — a quote with line items; status Draft / Sent
  / Accepted / Declined.
- **Invoice** and **InvoiceItem** — can be linked back to the `Job` or
  `Quote` it came from; status Draft / Sent / Paid / Overdue.
- **Task** — a lightweight to-do, optionally linked to a customer/job, that
  Ava can also create on your behalf.

See `prisma/schema.prisma` for the exact fields and relationships — it's
written to be readable on its own.

## Running it locally

You'll need Node.js and a PostgreSQL database.

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — connection string for your Postgres database.
   - `AUTH_SECRET` — a long random string (`openssl rand -base64 32`) used to
     sign session cookies.
   - `ANTHROPIC_API_KEY` — needed once the Ava AI assistant is wired up.
2. Install dependencies: `npm install`
3. Apply the database schema: `npx prisma migrate dev`
4. Start the app: `npm run dev`, then open http://localhost:3000

Useful commands:

- `npm run build` — production build (also type-checks and lints the whole app).
- `npm run lint` — ESLint only.
- `npx tsc --noEmit` — TypeScript check only.
- `npx prisma studio` — a visual browser for the database, handy while testing.

## Deploying it for real

- **App hosting:** [Vercel](https://vercel.com) is the natural fit for a
  Next.js app — connect the GitHub repo and it builds and deploys on every
  push.
- **Database:** any managed Postgres works. [Neon](https://neon.tech) or
  [Vercel Postgres](https://vercel.com/storage/postgres) both have a free
  tier that's plenty for testing with real users.
- Set the same environment variables (`DATABASE_URL`, `AUTH_SECRET`,
  `ANTHROPIC_API_KEY`) in the hosting provider's dashboard — never commit
  real secrets to the repository.
- Run `npx prisma migrate deploy` against the production database when
  shipping schema changes.

**Mobile / App Store:** V1 is a mobile-first responsive web app — on a phone
it can be added to the home screen and feels like an app. Because everything
goes through a proper API layer underneath, wrapping it for the App Store
(e.g. with [Capacitor](https://capacitorjs.com)) or building a React Native
app later is an addition, not a rewrite.

## What's in V1, and what's deliberately not

Built around six core areas: Dashboard, Customers, Jobs + Calendar (including
recurring jobs), Quotes, Invoices, and the Ava AI assistant, plus a
lightweight Tasks list and basic Staff assignment.

Deliberately left out for now (revisit only once V1 is validated with real
use): payroll, full accounting, inventory, complex job costing, GPS fleet
tracking, rostering, complex permission systems, marketing/CRM automation,
and large reporting suites. The rule of thumb: if a small trade-business
owner doesn't need it *this week* to run their business, it stays out.

## Known, low-risk item

`npm audit` flags a high-severity advisory in `deepmerge-ts`, a transitive
dependency of the Prisma CLI's config loader. It's a stack-exhaustion issue
triggered by merging maliciously deep objects — this only affects the
developer-run CLI tool at build time, not the deployed app's runtime, and we
don't feed it untrusted input. Worth re-checking when Prisma ships a fix
upstream, but not a risk to the running app.

## Current status

- [x] Data model, database, and migrations
- [x] Accounts, login, multi-tenant session scoping
- [x] App shell and navigation (mobile + desktop)
- [ ] Customers
- [ ] Jobs, calendar, recurring jobs
- [ ] Quotes
- [ ] Invoices
- [ ] Tasks
- [ ] Dashboard
- [ ] Ava AI assistant
