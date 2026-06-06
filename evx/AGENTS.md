# EVX – AI Health, Fitness & Nutrition Coach
## Autonomous Build Agent — Project Status

### Current Phase: MVP (Phase 1) — READY FOR DEPLOYMENT

---

## ✅ Completed (Phase 1)

### Architecture
- [x] React Native + Expo ~56 project structure
- [x] TypeScript strict mode — zero errors
- [x] Design system (dark/light theme, EVX brand colors)
- [x] Core TypeScript types (all entities typed)
- [x] Zustand store with persistence (theme, language)

### Backend
- [x] Supabase client with auth, DB, Storage
- [x] Complete service layer (auth, health, workouts, meals, labs, plans, progress)
- [x] Database schema — 9 tables, full RLS, triggers
- [x] Storage buckets (lab_reports private, avatars public)
- [x] **AI Orchestrator Edge Function** (OpenAI key server-side only)
  - Workout workflow
  - Nutrition workflow
  - Lab analysis workflow
  - Daily planning workflow

### Frontend
- [x] 6 reusable UI components (EVXButton, EVXCard, EVXInput, EVXHeader, EVXLoader, StatRing)
- [x] 10 screens (Splash, Login, Onboarding, Dashboard, Workout, Nutrition, Lab, DailyPlan, Progress, Settings)
- [x] Navigation (Stack + Bottom Tabs)
- [x] Custom hooks (useTheme, useAuth)

### Supporting
- [x] Localization (English + Arabic)
- [x] Utility functions (BMI, TDEE, water, dates)
- [x] EAS Build config (dev/preview/production)
- [x] Documentation (Architecture, API, Setup, Deploy)
- [x] Setup script

---

## 🔲 Next: Deployment Execution

Run these in order:

```
1. Fill in .env (Supabase URL + anon key)
2. supabase db push  (or paste SQL manually)
3. supabase functions deploy ai-orchestrator
4. supabase secrets set OPENAI_API_KEY=sk-...
5. npm start  →  test all flows
6. eas build --platform ios --profile production
7. eas build --platform android --profile production
8. npm run build:web
```

---

## 🗺️ Roadmap

### Phase 2 — Enhanced Health (after Phase 1 ships)
- Apple HealthKit + Google Fit integration
- Push notifications (reminders, streaks)
- Streak system + gamification
- Supplement tracker
- Body composition tracking (photos)
- Coach chat (ongoing AI conversation)
- Progress photo comparison

### Phase 3 — Education Platform
- Video workout library
- Nutrition database (food search + logging)
- Educational articles (AI-generated, expert-reviewed)
- Recipe library

### Phase 4 — Social + Growth
- Share progress (social cards)
- Community challenges
- Leaderboards
- Referral system
- Premium subscription (Stripe)

---

## Architecture Decisions Log

| Decision | Rationale |
|----------|-----------|
| Expo (~56) over bare RN | Faster iteration, EAS build, OTA updates |
| Supabase over Firebase | PostgreSQL + RLS + Edge Functions in one platform |
| OpenAI via Edge Function | API key never ships in app bundle (security) |
| Zustand over Redux | Simpler, TypeScript-native, no boilerplate |
| Bottom tabs (7) | All features accessible in max 2 taps |
| JSON persisted workouts | Flexible schema, no migrations for exercise changes |
| RLS everywhere | Users physically cannot read others' data |
| Lab analysis = educational only | Legal/liability — never diagnose |
