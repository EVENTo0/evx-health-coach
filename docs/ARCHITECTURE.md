# EVX Architecture Documentation

## Overview

EVX is a production-ready AI Health, Fitness & Nutrition Coach built with React Native (Expo) + Supabase + OpenAI.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native + Expo (~51) |
| Language | TypeScript (strict) |
| State Management | Zustand |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| Backend | Supabase (Auth, DB, Storage) |
| Database | PostgreSQL (via Supabase) |
| AI Layer | OpenAI GPT-4o |
| Form Handling | React Hook Form + Zod |

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
│   │   └── SettingsScreen.tsx
│   ├── components/       # Reusable UI primitives
│   │   ├── EVXButton.tsx
│   │   ├── EVXCard.tsx
│   │   ├── EVXInput.tsx
│   │   ├── EVXHeader.tsx
│   │   ├── EVXLoader.tsx
│   │   └── StatRing.tsx
│   ├── services/         # API and external integrations
│   │   ├── supabase.ts   # All DB operations
│   │   └── ai.ts         # AI Orchestrator
│   ├── store/            # Zustand global state
│   ├── hooks/            # Custom hooks
│   ├── navigation/       # Navigator config
│   ├── types/            # TypeScript types
│   ├── constants/        # Theme, config
│   ├── utils/            # Helper functions
│   └── i18n/             # English + Arabic translations
├── supabase/
│   └── migrations/       # SQL schema files
├── assets/               # Images, fonts, icons
├── docs/                 # Documentation
├── app.json              # Expo config
├── eas.json              # EAS Build config
└── .env.example          # Environment variables template
```

## AI Orchestrator

Single service in `src/services/ai.ts` with 4 workflows:

1. **Workout Workflow** — Generates personalized exercise plans based on user profile
2. **Nutrition Workflow** — Generates daily meal plans with macros
3. **Lab Workflow** — Provides educational summaries of lab results
4. **Daily Planning Workflow** — Creates optimized daily schedules

All workflows:
- Load user context from health profile
- Build structured prompts
- Request JSON from OpenAI GPT-4o
- Return typed TypeScript objects
- Save outputs to Supabase

## Database Schema

9 tables with full RLS:
- `users` — Extends Supabase auth
- `health_profiles` — Complete user health data
- `goals` — User fitness goals
- `workouts` — Generated workout plans (JSONB exercises)
- `meal_plans` — Generated nutrition plans (JSONB meals)
- `lab_reports` — Uploaded lab files (Supabase Storage)
- `lab_analysis` — AI-generated lab interpretations
- `daily_plans` — AI-generated daily schedules
- `progress_logs` — Daily tracking metrics

## Security

- Row Level Security on all tables
- Users can only access their own data
- Private storage bucket for lab reports
- Environment variables for all secrets
- Input validation on all forms

## Localization

Supports English (default) and Arabic (RTL prepared).
Translation files in `src/i18n/`.

## Design System

Premium health-tech aesthetic:
- Dark mode (default) + Light mode
- Brand color: `#00D4FF` (EVX Blue)
- Apple-inspired typography
- WHOOP-inspired data visualization
- Consistent spacing scale (4px base)
- Cards with glow effects for key metrics
