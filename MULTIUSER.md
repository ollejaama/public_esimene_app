# Atlas — Multi-User Implementation

This document is the single source of truth for the multi-user rebuild. Update the progress checkboxes as each item is completed. Designed to span multiple sessions.

---

## Architecture decisions

### Auth: Supabase Auth (replaces custom JWT)
The existing `training_session` cookie and HS256 JWT system must be **replaced entirely** — not layered on top of — by Supabase Auth. The previous multi-user attempt broke because it ran both in parallel.

- Supabase Auth handles: email/password, Google OAuth, Apple OAuth, email verification, password reset, session cookies
- Middleware reads Supabase Auth session instead of decoding `training_session`
- `userId` in every query becomes `auth.uid()` from the Supabase session
- The `profiles` table gets a `user_id` foreign key to `auth.users`

### RLS: enabled on all tables
With Supabase Auth in place, RLS is low-friction and adds meaningful defense in depth. Policies use `auth.uid() = user_id`. Data queries switch from the service role to the authenticated role. The application-level `.eq('user_id', ...)` filter stays as a second layer.

### Strava sync: webhooks primary, cron fallback, manual retained
- One webhook subscription covers all athletes (`/api/strava/webhook`)
- Incoming event maps `owner_id` (Strava athlete ID) → `user_id` via `profiles`
- Respond `200` immediately, do work in `waitUntil()` (Vercel)
- Hourly cron job catches anything the webhook missed
- Manual sync button stays, now acts as force-sync
- `STRAVA_WEBHOOK_VERIFY_TOKEN` and `CRON_SECRET` already in `.env.local`
- Webhooks only work on the deployed Vercel URL — register subscription after first deploy

### Email: Resend
- From address: `Atlas <hello@atlas.training>`
- `RESEND_API_KEY` already in `.env.local`
- Events: welcome, email verification, password reset, coach invite, team invite, new plan published

### Subscriptions (future, not in current sessions)
Supabase Auth provides stable `auth.uid()` as the Stripe customer key. A `subscriptions` table keyed to `user_id` will slot in naturally once the auth foundation is solid.

---

## Database schema overview

Design guidelines (exact column names at implementation time):

**`auth.users`** — managed by Supabase Auth, do not touch directly

**`profiles`** — one row per user, extends `auth.users`
- `user_id` → `auth.users.id`
- `display_name`, `role` (`athlete` | `coach`)
- Strava fields: `strava_athlete_id`, `access_token`, `refresh_token`, `token_expires_at`
- `last_synced_at`, `sync_progress` (JSON)

**Existing tables** — `activities`, `activity_hr_streams`, `activity_gps_streams`, `activity_laps`, `planned_activities`, `planned_rest_days`, `training_camps`, `hr_zone_settings`, `user_settings`, `illness_log`, `lactate_measurements`, `interval_sets`
- All already have `user_id` column — just need RLS policies added

**`teams`** — `id`, `coach_id`, `name`, `created_at`

**`team_members`** — `team_id`, `athlete_id`, `joined_at`, `left_at` (nullable)
- One team per athlete enforced at application level

**`coach_athlete_links`** — `coach_id`, `athlete_id`, `linked_at`
- Individual links (outside of teams)

**`invites`** — `id`, `token`, `coach_id`, `invitee_email`, `team_id` (nullable), `status` (`pending` | `accepted` | `declined`), `expires_at`

**`notifications`** — `id`, `user_id`, `type`, `payload` (JSON), `read`, `created_at`

**`team_planned_activities`** / **`team_planned_rest_days`** — mirrors of individual plan tables, scoped to `team_id`

---

## Sessions

### Session 1 — Database schema + Auth
**Goal:** User can sign up, verify email, log in, log out. All app routes protected. Nothing else needs to work yet.

- [ ] Replace `training_session` middleware with Supabase Auth session middleware
- [ ] Enable Supabase Auth in project (email/password, Google, Apple)
- [ ] Design and run full multi-user schema migration (all tables above + RLS policies)
- [ ] Sign up page (`/signup`): email, password, role selection (Athlete / Coach)
- [ ] Log in page (`/login`): email, password, keep-me-signed-in toggle, forgot password link
- [ ] Email verification flow (Supabase handles, configure redirect URL)
- [ ] Password reset flow via Resend
- [ ] Welcome email via Resend on sign up
- [ ] Protect all existing routes (`/home`, `/statistics`, `/activities`, `/settings`, `/plan`, `/compare`) — redirect to `/login` if not authenticated
- [ ] After login: athlete → `/home`, coach → `/coach`
- [ ] Log out working

**Done when:** Two different email accounts can sign up with different roles, verify, log in, and log out. App routes redirect to login when unauthenticated.

---

### Session 2 — Per-user data
**Goal:** All existing app pages work correctly for any logged-in athlete, scoped to their own data.

- [ ] Remove all hardcoded `user_id` references — derive from Supabase Auth session everywhere
- [ ] Update all Supabase queries to use authenticated client (not service role) so RLS applies
- [ ] Strava OAuth per athlete: connect from Settings, tokens stored in `profiles`
- [ ] Onboarding flow — Athlete: display name → connect Strava → set HR zones → `/home`
- [ ] Onboarding flow — Coach: display name only → `/coach`
- [ ] All existing features work per user: activity tagging, HR zones, manual activities, feeling, lactate, illness log, planned trainings, training camps
- [ ] `createServiceClient()` usages audited — replace with session-scoped client where appropriate

**Done when:** Two athletes can sign up, connect separate Strava accounts, sync activities, and see only their own data.

---

### Session 3 — Coach-athlete linking + teams + notifications
**Goal:** Coach can invite an athlete, athlete accepts, coach views athlete data. Teams work. Notifications appear in-app and via email.

**Coach-athlete linking**
- [ ] Coach can search athlete by name or email and send access request
- [ ] Athlete receives in-app notification + email (Resend)
- [ ] Athlete can accept or decline from notifications
- [ ] On accept: coach gets read access to athlete's Calendar and Statistics (RLS policy)
- [ ] Coach cannot edit athlete data (read-only enforced)

**Teams**
- [ ] Coach can create a team with a name
- [ ] Coach can invite athletes to a team by name or email
- [ ] Athlete can belong to maximum one team (enforced)
- [ ] Athlete receives in-app notification + email for team invite
- [ ] Athlete can accept or decline
- [ ] On join: coach automatically gets read access to that athlete's data
- [ ] Athletes in same team cannot see each other's data
- [ ] If athlete leaves team they continue to see team plan until leave date

**Coach home (`/coach`)**
- [ ] My teams: list with athlete count, click to enter team view
- [ ] My athletes: list of all linked athletes (team + individual) with last active date
- [ ] Click athlete → their Calendar and Statistics in read-only mode
- [ ] Clear navigation between team view and individual athlete view
- [ ] Visual indicator showing whose data is being viewed

**Settings — Teams & Coaches section (athlete)**
- [ ] Pending coach invites: accept / decline
- [ ] Pending team invites: accept / decline
- [ ] Current coach: name, linked date, remove option
- [ ] Current team: team name, coach name, joined date, leave option

**Notifications**
- [ ] Bell icon in nav with unread count
- [ ] Notifications for all invite events (sent, accepted, declined)
- [ ] Notification for new plan added by coach
- [ ] Quick accept/decline from bell dropdown
- [ ] Email via Resend: team invite, individual coach invite, new plan published

**Done when:** Coach invites athlete, athlete accepts, coach views athlete Calendar and Statistics. Team creation and joining works. Notifications appear in bell and via email.

---

### Session 4 — Strava webhooks + background sync
**Goal:** Webhooks handle real-time sync, cron fallback runs hourly, manual sync stays.

- [ ] `GET /api/strava/webhook` — verification handshake (echo `hub.challenge`)
- [ ] `POST /api/strava/webhook` — receive events:
  - [ ] `create` → fetch activity from Strava API, upsert to `activities`
  - [ ] `update` → re-fetch and upsert
  - [ ] `delete` → mark activity deleted/hidden
  - [ ] Deauthorization event → clear tokens in `profiles`
  - [ ] Map `owner_id` → `user_id` via `profiles.strava_athlete_id`
  - [ ] Handle expired tokens gracefully (skip, flag for re-auth)
  - [ ] Respond `200` immediately, do work in `waitUntil()`
- [ ] Hourly cron job: fetch new activities for all athletes since `last_synced_at`
  - [ ] Respect Strava rate limits
  - [ ] Skip athletes with expired tokens
  - [ ] Secured with `CRON_SECRET`
- [ ] Configure cron in `vercel.json`
- [ ] Manual sync button kept, now acts as force-sync
- [ ] Webhook subscription registration command documented (run after deploy)

**Done when:** Webhook endpoint exists and handles verification. Cron configured. Manual sync still works. Full webhook test after Vercel deployment.

---

### Session 5 — Team plan mode + realtime
**Goal:** Coach edits team plan, all athletes see it immediately. Coach can edit individual athlete plans. Athletes switch between Team plan and My plan.

**Two plan views for athlete**
- [ ] Team plan tab: universal plan set by coach, read-only for athlete
- [ ] My plan tab: starts as team plan, athlete can add/edit/delete on top
- [ ] Conflict handling: if coach adds team training that conflicts with personal training, both show side by side
- [ ] Toggle between Team plan and My plan in Plan page nav

**Coach team plan editing**
- [ ] Coach selects a team → edits team plan
- [ ] All athletes in team see changes via Supabase Realtime (no refresh)
- [ ] Visual indicator: coach is editing team plan

**Coach individual athlete plan editing**
- [ ] Coach selects athlete → identical permissions to athlete in their personal plan
- [ ] Changes affect only that athlete
- [ ] Visual indicator: coach is editing individual plan

**Realtime subscriptions**
- [ ] Coach edits team plan → all team athletes update instantly
- [ ] Coach edits individual athlete plan → that athlete updates instantly
- [ ] New notification → bell updates instantly

**Notify athletes button**
- [ ] Button sends in-app notification + email (Resend) to all relevant athletes when coach finishes planning

**Done when:** Coach edits team plan and team athletes see it immediately. Coach edits individual plan. Athlete switches between Team and My plan views.

---

### Session 6 — Public pages (independent, do anytime)
**Goal:** Clean landing page, polished sign up and log in pages.

- [ ] Landing page (`/`): hero, features, how it works, sign up CTA
- [ ] Sign up page (`/signup`): email/password, Google, Apple, role selection, terms checkbox
- [ ] Log in page (`/login`): email/password, Google, Apple, keep-me-signed-in, forgot password
- [ ] All three pages consistent with app design system
- [ ] Mobile responsive
- [ ] Post-sign-up → onboarding
- [ ] Post-login redirect by role: athlete → `/home`, coach → `/coach`
- [ ] Invite link handling:
  - [ ] Logged in → `/notifications`
  - [ ] Not logged in → `/login` then invite
  - [ ] No account → `/signup` then invite

**Done when:** Landing page looks professional. Sign up and log in work with all three auth methods. Redirects correct by role.

---

## Key files to touch (reference)

| Area | File |
|------|------|
| Auth middleware | `src/middleware.ts` |
| Session util | `src/lib/session.ts` → replace with Supabase Auth helper |
| Supabase client | `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts` |
| Strava sync | `src/lib/sync/syncActivity.ts`, `src/lib/sync/store.ts` |
| Sync API | `src/app/api/sync/route.ts` |
| Webhook endpoint | `src/app/api/strava/webhook/route.ts` (new) |
| Cron endpoint | `src/app/api/cron/sync/route.ts` (new) |
| Email | `src/lib/resend.ts` (recoverable from `git show 4f4a2f6:src/lib/resend.ts`) |
| Migrations | `supabase/migrations/` — new files from 019 onward |

## Recoverable reference code (from previous multi-user attempt)

Git ref `4f4a2f6` has working implementations of:
- `src/lib/resend.ts` — full mail service
- `src/app/page.tsx` — landing page UI
- `src/app/(auth)/login/page.tsx` and `signup/page.tsx`
- `src/components/settings/TeamsCoachesSection.tsx`
- API routes listed above

Recover with: `git show 4f4a2f6:<path>`
