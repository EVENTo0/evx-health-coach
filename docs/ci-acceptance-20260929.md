# EVX Health Coach — source CI acceptance

Date: 2026-09-29 (Asia/Dubai)
Source/test baseline: PR #2, `112264680247e835e4cf4779fa3eeb91850c3435`. A concurrent basic PR typecheck gate at `44920c5d84b42c0e9c6d629e9e3ec3c5073fc65e` was preserved and extended in the same workflow file.

## Problem and repair

At the initial baseline PR #2 had no pull-request verification because the only workflow built Android through EAS on main/manual triggers. The concurrent basic gate added mobile typechecking; this patch extends that independent read-only PR job to cover the admin bundle and credential boundaries. It does not invoke, broaden or alter EAS production triggers.

The new job checks out source using sparse patterns, refuses runtime environment files, disables Expo dotenv loading, installs both existing npm lockfiles with lifecycle scripts disabled, typechecks the mobile source, and compiles the admin. Admin TypeScript now uses `--noEmit`, avoiding generated JavaScript in the source directory.

An unused `EXPO_PUBLIC_OPENAI_API_KEY` export was removed. Stale admin setup copy and environment typings that requested a service-role key were corrected to the existing public-key adapter contract. A source boundary check rejects public environment names for server secrets. No provider key is configured or tested.

## Local evidence

- Exact selected-source export: 68 files match Git blob hashes; runtime environment files, vendored dependencies, generated builds and duplicate source copies were excluded.
- Root `npm ci --ignore-scripts --no-audit --no-fund`: PASS.
- Root `npm run type-check` with `EXPO_NO_DOTENV=1`: PASS.
- Admin `npm ci --ignore-scripts --no-audit --no-fund`: PASS.
- Admin `npm run build`: PASS, 74 modules; framework remains Vite 5.4.21.
- Existing lockfiles are consistent; no framework/SDK migration or dependency-range expansion was needed for this gate.

Fresh PR CI is required for the submitted commit. This file records local evidence; the PR body/checks carry the remote run result.

## Environment-file review

Only variable names and credential categories were inspected; values were not printed, copied into evidence, used for authentication, or tested.

- Root, admin and duplicate app Supabase keys classify as public `anon` JWTs, not privileged server keys. Their presence is not evidence of a secret breach.
- The duplicate admin service-key field is placeholder/redacted, not a verified credential.
- The tracked agent environment contains credential-named fields whose authority or validity could not be established from the safe classification. Treat these as SECURITY_REVIEW before final activation; no active leak or automatic rotation completion is claimed.
- Runtime `.env` files are removed from the candidate head, and `.gitignore` protects future local configuration. Historical commits remain. Any credential later confirmed to have been real must be revoked/rotated; deleting a file alone cannot invalidate it.

## Explicit remaining gates

This is source compilation/CI evidence only. It does not verify Supabase policies against real authenticated accounts, health-data privacy, clinical correctness, AI output safety, mobile-device behavior, Android target API, store readiness, subscriptions or production operations. Vite/Recharts lifecycle debt, the duplicate app tree and previously tracked `node_modules` remain separately recorded maintenance work; this patch does not claim a complete security upgrade.

No EAS build, store publication, live AI call, hosted DB mutation, secret setup, merge or deployment is part of this gate.
