# EVX Architecture Documentation

## Overview

EVX is a production-ready AI Health, Fitness & Nutrition Coach built with React Native (Expo) + Supabase + OpenAI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native + Expo SDK 56 |
| Language | TypeScript (strict) |
| State Management | Zustand |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| Backend | Supabase (Auth, DB, Storage, Edge Functions) |
| Database | PostgreSQL (via Supabase) |
| AI Layer | OpenAI GPT-4o via Supabase Edge Function |
| CI/CD | GitHub Actions + EAS Build (cloud) |
| Build Output | AAB (Android), IPA (iOS — pending) |

---

## Project Structure

```
evx/
├── src/
│   ├── screens/          # One file per screen
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── WorkoutScreen.tsx
│   │   ├── NutritionScreen.tsx
│   │   ├── LabScreen.tsx
│   │   ├── DailyPlanScreen.tsx
│   │   ├── ProgressScreen.tsx
│   │   ├── EducationScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/       # Reusable UI components
│   ├── services/         # API + Supabase + AI layer
│   ├── navigation/       # AppNavigator
│   ├── store/            # Zustand global state
│   ├── constants/        # Theme, config
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # English + Arabic translations
│   └── types/            # Shared TypeScript types
├── supabase/
│   ├── functions/
│   │   └── ai-orchestrator/  # All AI calls go here (protects API key)
│   └── migrations/           # PostgreSQL schema migrations
├── android/
│   └── gradle.properties     # JVM heap config for EAS builds
├── .github/
│   └── workflows/
│       └── android-build.yml # CI/CD pipeline
├── eas.json                  # EAS build profiles
└── app.json                  # Expo config
```

---

## AI Architecture

All AI interactions are routed through the `ai-orchestrator` Supabase Edge Function. The OpenAI API key is **never exposed** to the client.

```
Mobile App
    │
    ▼
Supabase Edge Function (ai-orchestrator)
    │  - Loads user context from DB
    │  - Selects workflow (workout / nutrition / lab / daily)
    │  - Builds prompt
    │  - Calls OpenAI GPT-4o
    │  - Stores output in Supabase
    │
    ▼
OpenAI GPT-4o
```

### Workflows

| Workflow | Inputs | Outputs |
|----------|--------|---------|
| Workout | Goals, fitness level, schedule, symptoms | Exercises, sets, reps, rest, modifications |
| Nutrition | Goals, preferences, symptoms | Meals, portions, hydration, substitutions |
| Lab Analysis | Uploaded lab report | Educational summaries, trends, lifestyle notes |
| Daily Plan | Schedule, workouts, meals, recovery | Timeline, priorities, daily actions |

---

## Database Schema

Managed via Supabase migrations in `supabase/migrations/`.

Key tables:
- `profiles` — user profile + health data
- `workouts` — generated workout plans
- `nutrition_plans` — generated meal plans
- `lab_reports` — uploaded lab files + AI analysis
- `daily_plans` — daily planning outputs
- `progress_logs` — user progress entries

All tables have Row Level Security (RLS) enabled.

---

## CI/CD Pipeline

```
git push → main
    │
    ▼
GitHub Actions (.github/workflows/android-build.yml)
    │  1. Checkout code
    │  2. Install Node.js 20
    │  3. npm install
    │  4. Setup EAS CLI
    │  5. eas build --platform android --profile production
    │
    ▼
EAS Build Servers (expo.dev)
    │  - Runs Gradle + React Native bundler
    │  - Produces signed .aab
    │
    ▼
Artifact available at expo.dev/accounts/evento0/projects/evx/builds/
```

---

## Security

- OpenAI API key stored as Supabase secret (server-side only)
- Supabase anon key stored as GitHub secret + EAS env var
- RLS enforced on all user data tables
- No sensitive keys in client bundle
- Input validation via Zod on all forms

---

## Build Status

| Platform | Status | Date |
|----------|--------|------|
| Android (AAB) | ✅ Production build succeeded | June 15, 2026 |
| iOS (IPA) | ⏳ Pending Apple Developer enrollment | — |
| Web | ☐ Not yet deployed | — |

**Latest Android Build:**
- EAS Build ID: `772f03ce-bd31-432c-92f6-781d2343faaa`
- Download: https://expo.dev/artifacts/eas/3jlC2dSy4Uy-kTUXlZFgCkH4DF2gIPXSbQofLuN6X90.aab
