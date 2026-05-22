---
name: project-auth-session
description: Context from the auth implementation session — schema, packages, and bridge cookie pattern
metadata:
  type: project
---

Multi-user auth was implemented in session 2026-05-21. Key decisions:

- `@supabase/ssr` installed for SSR-compatible Supabase Auth (cookies-based)
- `resend` installed for transactional email
- Migration `021_auth_and_multi_user.sql` adds: `user_profiles`, `teams`, `team_members`, `coach_athlete_links`, `invites`, `notifications`; also adds `auth_user_id uuid` column to existing `profiles` table

**Bridge cookie pattern:** When a user logs in via Supabase Auth, the app also sets the legacy `training_session` JWT cookie (same format as before). This lets existing Server Components that call `getSession()` keep working. The middleware checks Supabase Auth first, then falls back to the legacy cookie.

**Why:** The codebase still uses `getSession()` from `src/lib/session/index.ts` in many pages and API routes. Migrating everything at once would touch too many files. The bridge cookie avoids that during the multi-user transition.

**How to apply:** When adding new features, use `createAuthServerClient()` from `src/lib/supabase/auth-server.ts` for Supabase Auth context. New API routes should check the session via Supabase Auth, not the legacy JWT. Only gradually retire `getSession()` usages.

Auth pages live at `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password` (route group `(auth)`).

Supabase dashboard config required before auth works:
- Auth > URL Configuration: Site URL = `http://localhost:3000`, add `http://localhost:3000/**` to Redirect URLs
- Auth > Providers: Enable Google and Apple with their OAuth credentials
- Run migration 021 in SQL editor

RESEND_API_KEY is already set in .env.local.
