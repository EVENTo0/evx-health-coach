# EVX Deployment Guide

## Prerequisites

```bash
npm install -g expo-cli eas-cli supabase
```

---

## 1. Supabase Setup (5 min)

### a) Create Project
1. Go to https://supabase.com → New project
2. Note your **Project URL** and **anon key**

### b) Run Migrations
In Supabase Dashboard → SQL Editor, run in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_storage_buckets.sql`

### c) Configure Auth
- Authentication → Settings → Enable Email signup
- Optional: Enable Google/Apple OAuth under Providers

---

## 2. Environment Variables

```bash
cp .env.example .env
```

Fill in:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 3. Deploy AI Edge Function (Required for AI features)

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the AI orchestrator
supabase functions deploy ai-orchestrator

# Set the OpenAI secret (server-side only, never in app bundle)
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
```

Verify deployment:
```bash
supabase functions list
```

---

## 4. Local Development

```bash
npm install
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Browser at localhost:19006
```

---

## 5. Production Build

### Android ✅ (Build Successful — June 15, 2026)

Builds are triggered automatically via GitHub Actions on every push to `main`.

**Latest Production Build:**
- EAS Build ID: `772f03ce-bd31-432c-92f6-781d2343faaa`
- EAS Build Page: https://expo.dev/accounts/evento0/projects/evx/builds/772f03ce-bd31-432c-92f6-781d2343faaa
- AAB Download: https://expo.dev/artifacts/eas/3jlC2dSy4Uy-kTUXlZFgCkH4DF2gIPXSbQofLuN6X90.aab

To trigger a new build, push any change to the `main` branch. GitHub Actions handles the rest.

**Build Configuration:**
- Resource class: `medium` (EAS free tier compatible)
- JVM heap: `3072m` (set via `android/gradle.properties`)
- Gradle daemon: disabled
- Output: `.aab` (Android App Bundle for Play Store)

### iOS (Pending — Apple Developer enrollment required)
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

### Web
```bash
npm run build:web
# Output in dist/ — deploy to Vercel/Netlify/Cloudflare Pages
```

---

## 6. GitHub Actions CI/CD

The workflow at `.github/workflows/android-build.yml` runs automatically on push to `main`.

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | EAS authentication token |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

---

## 7. Environment Checklist

| Item | Status |
|------|--------|
| Supabase project created | ✅ |
| SQL migrations applied | ✅ |
| Storage buckets created | ✅ |
| RLS policies active | ✅ |
| Edge function deployed | ✅ |
| OPENAI_API_KEY set as secret | ✅ |
| GitHub secrets configured | ✅ |
| Android build succeeded | ✅ |
| Android AAB ready for Play Store | ✅ |
| iOS build submitted | ⏳ Pending Apple Developer enrollment |
| Web deployed | ☐ |

---

## 8. Post-Deploy Verification

Test each flow:
1. ✅ Register new account
2. ✅ Complete onboarding (5 steps)
3. ✅ Generate AI workout
4. ✅ Generate meal plan
5. ✅ Upload lab report
6. ✅ Analyze lab report (AI)
7. ✅ Generate daily plan
8. ✅ Log progress
9. ✅ View dashboard
10. ✅ Toggle dark/light mode

---

## 9. Google Play Submission Steps

1. Go to https://play.google.com/console
2. Create new app → Set up store listing
3. Navigate to **Testing → Internal testing**
4. Upload the `.aab` file from the EAS artifacts link above
5. Add internal testers → Roll out release
6. After testing, promote to **Production**
