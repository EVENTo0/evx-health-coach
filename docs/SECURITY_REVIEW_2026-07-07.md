# EVX Security Review — 2026-07-07

Scope: React Native/Expo app (`src/`), Supabase Edge Functions (`supabase/functions/`), Admin dashboard (`admin/src/`).
Method: static review using the `security-best-practices` skill (JS/TS + React frontend guidance) plus manual inspection of auth, RLS, and secret handling.

## Executive Summary

Two critical/high findings expose the entire production database to unauthenticated or over-privileged access. Both are fixable without touching the mobile app or its release pipeline. Everything else (auth flow, AI orchestrator JWT check, RLS on core tables, no eval/XSS patterns) is in good shape.

## Findings

### [F1] CRITICAL — Admin dashboard ships the Supabase Service Role Key to the browser
**File:** `admin/src/supabase.ts` (`VITE_SUPABASE_SERVICE_KEY`)
**Impact:** Vite inlines any `VITE_*` env var directly into the client-side JS bundle. The service role key bypasses *all* Row Level Security. Anyone who opens dev tools on the deployed admin site (or downloads the bundle) can extract this key and get unrestricted read/write access to every table — all users' health profiles, lab reports, subscriptions, everything.
**Fix (recommended):** Never use the service role key in a browser-loaded app. Two options:
1. Move all admin reads/writes behind a small authenticated backend (Supabase Edge Function or Base44 backend function) that checks the caller is an admin, then uses the service key server-side only. Admin frontend calls that function with the user's own JWT.
2. Or: give admin users a `role = 'admin'` claim and write RLS policies that allow admins to read/write all rows using the anon key + user JWT (no service key needed at all in the frontend).
Option 1 is faster to ship without touching your RLS policies.

### [F2] HIGH — `run-migration` Edge Function has zero authentication
**File:** `supabase/functions/run-migration/index.ts`
**Impact:** This function creates a service-role Supabase client and runs SQL, but never checks the caller's identity — no JWT check, no admin check, nothing. Anyone who discovers the URL (Supabase function URLs are guessable/discoverable) can invoke it. Right now the SQL is hardcoded, so it can't be used for arbitrary injection today, but it's a live, unauthenticated door into privileged DB operations that was left over from the manual migration step.
**Fix:** Either delete this function now (its one-time job — creating the subscriptions table — is done), or add a hard auth check (shared secret header or admin JWT check) before it runs anything.

### [F3] MEDIUM — Wildcard CORS (`Access-Control-Allow-Origin: '*'`) on Edge Functions
**Files:** `ai-orchestrator/index.ts`, `run-migration/index.ts`
**Impact:** Low risk on its own since `ai-orchestrator` requires a valid JWT — but combined with F2 (no auth) it makes `run-migration` trivially callable from any website/script. Not urgent once F2 is fixed.

### [F4] LOW/INFO — No request body schema validation in `ai-orchestrator`
**File:** `supabase/functions/ai-orchestrator/index.ts`
**Impact:** `profile` and `lab_text` are passed straight from the client into OpenAI prompts with no shape/length validation. Not a cross-user data risk (JWT-scoped), but malformed input or basic prompt injection could produce garbage AI output. Low priority — add a lightweight schema check (zod) when convenient.

## Not a problem (checked, clean)
- No `eval`/`new Function`/`dangerouslySetInnerHTML` anywhere in the codebase.
- No hardcoded API keys or secrets committed to the repo.
- `ai-orchestrator` correctly validates the JWT before running any workflow; OpenAI key stays server-side only.
- Core tables (`001_initial_schema.sql`, `003_subscriptions.sql`) have RLS enabled with per-user policies.
- Mobile app's persisted Zustand store only caches `theme`/`language` locally — no health data or tokens cached in plaintext on-device storage.

## Priority order
1. Fix F1 (service role key exposure) — do this first, it's the real risk.
2. Delete or lock down `run-migration` (F2).
3. F3 resolves itself once F2 is fixed.
4. F4 whenever there's spare time — not urgent.
