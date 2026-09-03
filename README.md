# Mẹ & Bé — Pregnancy, Nutrition & Baby Care for Vietnamese Families

[![CI](https://github.com/phungthien269/PregnantTracking/actions/workflows/ci.yml/badge.svg)](https://github.com/phungthien269/PregnantTracking/actions/workflows/ci.yml)

A full-stack web app supporting mothers from pregnancy (weekly fetal development,
nutrition, symptoms, checkup schedule) through postpartum and baby care 0–24 months
(feeding, sleep, diapers, growth tracking, milestones, vaccinations) — plus family
coordination (tasks, shopping, budget, reminders), a learning library (PDF/EPUB/URL
import, quizzes, Q&A), and an AI assistant grounded in the family's own library.

**Live demo:** https://pregnanttracking.vercel.app
Log in with `cuti3bqn@gmail.com` / `demo1234` (mom) or `bo@demo.vn` / `demo1234` (dad) —
or create a new account and join the demo family with invite code `MEVABE`.

> **Status (2026-08-31): deployed to production.** Supabase (Postgres + Auth +
> Storage + RLS), Web Push notifications, real email delivery via Resend, offline
> PWA, VI/EN UI toggle, and a green CI pipeline.
> Measured on simulated mobile 4G: LCP 2.8–3.7s · TBT ~100ms · **CLS 0**.

## Quick start

```bash
pnpm install
pnpm dev          # web at http://localhost:3000 (cloud mode when Supabase env is set)
pnpm typecheck    # tsc across the monorepo (turbo)
pnpm lint         # eslint
pnpm build        # next build (turbo)
bash scripts/smoke.sh --rebuild   # 65 acceptance checks (local data mode)
```

Health check: `GET /api/v1/health` → `{ status, mode, time }`.
Requirements: Node ≥ 20, pnpm ≥ 11 (tested with `pnpm@11.17.0`).

**Two data modes, one interface.** Without Supabase env vars the app runs a local
SQLite demo (seeded Vietnamese data); with them, the same `DataApi` interface talks
to the real Supabase backend (RLS-enforced). Nothing to configure to try it out.

## Tests

| Command | What it does |
|---|---|
| `bash scripts/test-domain.sh` | Domain/UI unit checks (8 files, no vitest needed) |
| `bash scripts/test-web.sh` | Web layer checks (39 files) |
| `bash scripts/smoke.sh --rebuild` | 65 end-to-end acceptance checks against a production build |
| `node scripts/check-env.ts` | Environment audit: which vars are set, which mode the app will run |

## Architecture

```
apps/web          Next.js App Router (responsive web)
apps/ios          SwiftUI companion (source + guide — needs Xcode, see iOS section)
packages/domain   Zod schemas + business rules (pure, React-free)
packages/ui       Design tokens + component primitives
supabase/         Migrations + seed (PostgreSQL, RLS)
scripts/          smoke.sh · test-*.sh · check-env.ts · supabase-provision.sh
```

Key seams:

| Path | What lives there |
|---|---|
| `packages/domain/src/core.ts` | Canonical enums + base types (immutable contract) |
| `apps/web/lib/data/api.ts` | `DataApi` interface (backend ↔ frontend seam, immutable) |
| `apps/web/lib/data/index.ts` | Resolver: local SQLite (demo) vs Supabase (cloud) by env |
| `apps/web/lib/data/local.ts` | SQLite implementation (persistent demo, per-user scoping) |
| `apps/web/lib/data/supabase.ts` | Supabase implementation (RLS via request-scoped client) |
| `apps/web/lib/ai/` | OpenRouter gateway (chat with persisted history, insights, quiz-gen, symptom triage, citations) |
| `apps/web/lib/library/` | PDF/EPUB/URL → chunk → stage tags → citations → quiz |
| `apps/web/lib/meals-photo/` | Meal photos → AI/heuristic recognition → confirm-before-save |
| `apps/web/lib/notify/` | Email (Resend/SMTP) + Web Push (VAPID, `web-push`) |
| `apps/web/lib/inngest/` | Notification engine — due-today scan, per-group/channel preferences |
| `apps/web/middleware.ts` | Rate limiting (30/60/120 rpm) + CSRF origin check on `/api/v1/*` |
| `supabase/migrations/*.sql` | Schema + RLS policies (16 migrations) |
| `supabase/seed/seed.sql` | Seed data (demo family, pregnancy, baby, meals, tasks, chat) |

Conventions: `@/*` → `apps/web/*`; every family-scoped table carries `family_id`
(plus `private_owner_id` for private rows); API envelope is `{ data }` or
`{ error: { code, message, details } }`; all boundary input validated with Zod.

## Features

- **Pregnancy timeline** — weekly fetal development, nutrition focus, checkup
  milestones (WHO/ACOG/NHS references), trimester-aware insights.
- **Baby care 0–24m** — feeding/sleep/diaper logs, growth charts with WHO
  percentile bands (linear interpolation between anchor months), vaccination
  schedule (TCMR circular 52/2025), milestones.
- **Family coordination** — tasks, shopping (auto-generated from meal ingredients),
  budget, reminders, per-group/per-channel notification preferences.
- **AI assistant (OpenRouter)** — chat grounded in the family's library with
  persisted history; symptom triage (hard safety gates first); quiz generation.
  Falls back to library content when the AI provider is unavailable.
- **Learning library** — import PDF/EPUB/URL → chunking with citations → stage
  tags → auto-generated quizzes with per-question error reports.
- **Meal photos** — upload → AI recognition → confirm-before-save; stored in
  Supabase Storage.
- **Checkup OCR** — photo of a medical report → extract measurements → confirm →
  charted.
- **Notifications that really deliver** — due-today engine honors per-group,
  per-channel preferences; **email via Resend**; **Web Push** via VAPID
  (`web-push`), with dead-endpoint cleanup (404/410).
- **Offline PWA** — manifest + service worker: stale-while-revalidate for API
  GETs, navigation race (network ≤ 800ms, then cached shell), offline fallback.
- **Security** — CSP + security headers, rate limiting, CSRF origin check, RLS
  on every family-scoped table, service-role keys server-only.
- **Performance** — route skeletons matching page layouts (CLS 0), View
  Transitions-style page enter, per-request read memoization, dynamic imports
  for heavy components, 6 SQLite indexes + Supabase indexes.
- **Accessibility** — WCAG AA: contrast, focus traps, keyboard/ARIA, skip links,
  `prefers-reduced-motion` honored everywhere.

## Supabase setup

Follow `supabase/README.md` for the full runbook. Short version:

```bash
# 1. Create a project at supabase.com; grab URL + anon key (Settings → API).
# 2. Apply migrations + seed:
supabase link --project-ref <ref>
supabase db push                    # migrations 0001–0016 (incl. RLS policies, storage, push subs)
bash scripts/supabase-provision.sh  # seed data + demo users (Admin API — never raw-INSERT auth.users)
# 3. Set app env:
cp apps/web/.env.example apps/web/.env.local
#    NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (required for cloud mode)
#    SUPABASE_SERVICE_ROLE_KEY (register/bootstrap) · OPENROUTER_API_KEY (AI)
#    RESEND_API_KEY (email) · VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY (web push)
node scripts/check-env.ts           # confirm each variable's status
```

Demo users are provisioned via the Supabase **Admin API** (never raw-INSERT into
`auth.users` — it corrupts GoTrue state; see `scripts/supabase-provision.sh`).

## Deployment (Vercel)

The repo deploys as a monorepo with **Root Directory = `apps/web`** (set in the
Vercel project settings) and a `vercel.json` that pins `pnpm install`. Required
env vars are listed in `apps/web/.env.example` — remember `NEXT_PUBLIC_*` values
are inlined at build time, so changing them requires a rebuild.

## iOS companion

`apps/ios` contains a SwiftUI implementation: auth + Keychain + biometrics,
dashboard, offline quick-entry (AES-GCM), two-way HealthKit, push. To run on a
Mac with Xcode:

```bash
cd apps/ios
xcodegen generate
open Mevabe.xcodeproj     # pick a simulator and Run
```

Without Xcode, the sources still typecheck via `swiftc -typecheck`.
