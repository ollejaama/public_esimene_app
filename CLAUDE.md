# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run Next.js linter
```

No test suite exists.

## What This App Is

Atlas is a training analytics app for endurance athletes. It syncs Strava activities, computes HR zone distributions, and provides week/month/season views of training load. There is also a coach mode (read-only) and a plan mode for scheduling future sessions.

## Auth

Session-based JWT (not Supabase Auth). Cookie name: `training_session`, signed with `SESSION_SECRET` (HS256, 30-day expiry). Session payload: `{ userId, stravaAthleteId, role: 'athlete' | 'coach' }`.

Middleware at `src/middleware.ts` guards `/home`, `/statistics`, `/activities`, `/settings`, `/plan`, `/compare`. Coaches cannot access `/settings`.

All Supabase queries use `createServiceClient()` (service role, bypasses RLS). No RLS policies are in use. User isolation is enforced by including `user_id` in every query.

## Database

Supabase Postgres. Migrations live in `supabase/migrations/` and must be run manually in the Supabase SQL Editor in order (001 → 018).

Key tables:
- `profiles` — one row per athlete; stores Strava OAuth tokens and `sync_progress` JSON
- `activities` — synced Strava activities; has `hidden`, `overridden_duration`, `overridden_sport_type`, `custom_sport_tag`, `intensity_type`, `rpe` fields
- `activity_hr_streams` / `activity_gps_streams` / `activity_laps` — per-activity stream data
- `planned_activities`, `planned_rest_days`, `training_camps` — plan-mode data
- `hr_zone_settings` — 5 custom HR zones (I1–I5) + `rest_day_threshold`
- `user_settings` — feature flags: `show_rpe`, `rpe_scale`, `show_lactate`, `theme`

## Strava Sync

`POST /api/sync?mode=incremental|full` triggers background sync via Vercel `waitUntil()`. Incremental fetches since `last_synced_at`; full walks backward to a 3-year cutoff. Batches of 50 activities with 1 s delays; pauses if Strava rate limit ≥ 85%.

Progress is tracked in-memory (`src/lib/sync/store.ts`) and written to `profiles.sync_progress`. The UI polls `GET /api/sync-progress` (SSE stream).

Token refresh is handled transparently in `getValidAccessToken(userId)` — refreshes if expiring within 5 minutes.

## Sport Types & Custom Tags

Strava sends a `sport_type` string (e.g. `"Run"`, `"NordicSki"`). `SPORT_TYPE_MAP` in `src/lib/constants.ts` maps these to display labels.

Users can override with `overridden_sport_type` and set a `custom_sport_tag` for skiing subtypes:
- `crosscountry_classic`, `crosscountry_skate`, `rollerski_classic`, `rollerski_skate`, `treadmill_classic`, `treadmill_skate`

`effectiveDuration()` in `src/lib/activity.ts` resolves: `overridden_duration` → `moving_time` → `elapsed_time`. `effectiveContributionSeconds()` applies `contribution_hours` for partial credit.

## Zone System

6 zones: I0 (rest) through I5. Configurable max BPM per zone in `hr_zone_settings`. Zone seconds per activity are computed from the HR stream in `src/lib/analytics/hrZones.ts`.

Season runs **May 1 → April 30**.

## Design System

Tailwind with custom CSS variable-based tokens. All colors use `atlas-*` classes: `atlas-bg`, `atlas-panel`, `atlas-ink`, `atlas-muted`, `atlas-faint`, `atlas-rule`, `atlas-accent`. Zone colors: `atlas-z0` through `atlas-z5`. Typography: `font-serif` (Newsreader) for headings/numbers, `font-mono` for labels/metadata, `font-sans` for body text.

## Key Files to Know

- `src/lib/constants.ts` — sport type map, custom tag labels, zone colors
- `src/lib/activity.ts` — duration/contribution helpers, display title logic
- `src/lib/analytics/hrZones.ts` — zone second computation
- `src/lib/sync/syncActivity.ts` — per-activity upsert logic
- `src/components/plan/PlanWeekView.tsx` — main plan UI with add/edit modal wiring
- `src/components/plan/PlanActivityModal.tsx` — create/edit planned activity modal
