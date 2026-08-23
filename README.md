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
first. See `src/server/ava/` and "How Ava works" below.

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
    ava/                  Ava's tools, system prompt, and conversation loop.
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

## How Ava works

Ava is powered by Claude (Anthropic's API) via `src/server/ava/`:

- **`tools.ts`** defines the exact list of things Ava can do — nothing else.
  Read tools (`getTodaysJobs`, `getUpcomingJobs`, `getOutstandingInvoices`,
  `getPendingQuotes`, `getCustomer`, `getLapsedCustomers`, `getOpenTasks`) run
  immediately and only ever return data scoped to the logged-in business.
  Write tools (`createTask`, `createJob`, `createRecurringJob`) are split into
  a `prepare` step (validates the request and writes nothing) and an
  `execute` step (does the actual database write) — `execute` is only ever
  called after the user taps "Confirm" in the chat UI.
- **`chat.ts`** runs the conversation loop by hand (not the SDK's automatic
  tool runner), because a confirmation can arrive several HTTP requests
  later — the loop needs to be able to pause and resume across separate
  Server Action calls, which the automatic runner isn't built for. When
  Claude asks for a write tool, the loop stops and hands the client a
  `pendingAction` (the proposed change plus a human-readable summary)
  instead of executing it.
- **`AskAva.tsx`** is the chat widget on the dashboard. It keeps the raw
  conversation in memory (lost on page refresh — there's no chat-history
  table in V1, a reasonable next addition) and renders a Confirm/Cancel card
  whenever a `pendingAction` comes back.
- If a customer name is ambiguous or matches nobody, the tool tells Claude so
  directly (as a tool error) so it can ask a clarifying question, rather than
  guessing or showing a confirmation for the wrong person.

Ava needs `ANTHROPIC_API_KEY` set to work — without it, the chat widget
explains that clearly instead of erroring. The dashboard's "AI suggestions"
(quiet-week nudges, overdue invoices, stale quotes) are separate: they're
plain rule-based checks in `src/server/data/dashboard.ts`, not an LLM call —
fast, free, and available even without an API key, and Ava's tools are built
from the exact same underlying data functions.

**Testing note:** this was built and tested end-to-end (signup through every
feature, including the "not configured" state) without a live Anthropic API
key available in the build environment, so the tool-calling conversation loop
itself is implemented strictly to the documented API/SDK behaviour but
hasn't been exercised against a real model. Worth a careful first real-world
test — a good first check is "What do I have on today?" followed by "Create
a task to follow up on it."

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
- [x] Customers
- [x] Jobs, calendar, recurring jobs
- [x] Quotes
- [x] Invoices
- [x] Tasks
- [x] Dashboard (today/upcoming/tasks/quotes/invoices + rule-based suggestions)
- [x] Ava AI assistant (tool-calling + confirmation flow; see the testing
      note above — not yet exercised against a live API key)

Every feature above was tested end-to-end with a scripted browser (Playwright)
covering the full flow: signup, create/edit/status changes, cross-feature
links (job → invoice, quote → invoice), and cross-tenant access checks (a
customer/job/quote/invoice id from another business correctly 404s rather
than leaking data). Two real bugs were caught this way and fixed: a `null`
vs `undefined` mismatch between `FormData.get()` and Zod's `.optional()` that
broke invoice creation from a job/quote, and the same bug in task creation.

### Natural next steps

Reasonable follow-ups once this is being used for real, roughly in order of
value: persist Ava's chat history (a lightweight `AvaMessage` table) so a
page refresh doesn't lose the conversation; let Ava actually send quotes and
invoices by email, rather than just marking them "Sent"; a settings page for
notification preferences; and, once there's a live API key to test against,
a pass on Ava's system prompt informed by real conversations.
