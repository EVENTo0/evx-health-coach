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

### iOS
```bash
eas build --platform ios --profile production
# Submit to App Store:
eas submit --platform ios
```

### Android
```bash
eas build --platform android --profile production
# Submit to Play Store:
eas submit --platform android
```

### Web
```bash
npm run build:web
# Output in dist/ — deploy to Vercel/Netlify/Cloudflare Pages
```

---

## 6. Environment Checklist

| Item | Status |
|------|--------|
| Supabase project created | ☐ |
| SQL migrations applied | ☐ |
| Storage buckets created | ☐ |
| RLS policies active | ☐ |
| Edge function deployed | ☐ |
| OPENAI_API_KEY set as secret | ☐ |
| .env filled with Supabase keys | ☐ |
| iOS build submitted | ☐ |
| Android build submitted | ☐ |
| Web deployed | ☐ |

---

## 7. Post-Deploy Verification

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
