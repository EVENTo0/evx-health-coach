# EVX Launch Checklist

## Pre-Build (One-Time Setup)

### Apple (iOS)
- [ ] Apple Developer account active ($99/yr)
- [ ] Create App ID: com.evx.healthcoach at developer.apple.com
- [ ] Create app in App Store Connect — get the ASC App ID
- [ ] Fill eas.json submit.production.ios fields:
      appleId, ascAppId, appleTeamId

### Android
- [ ] Google Play Developer account active ($25 one-time)
- [ ] Create app in Google Play Console
- [ ] Download service account JSON → save as google-service-account.json
- [ ] Create google-services.json from Firebase → place in evx/ root

### Expo
- [ ] Run: eas login
- [ ] Run: eas build:configure  (links to your Expo account)
- [ ] Set EAS secret: EXPO_PUBLIC_SUPABASE_URL
- [ ] Set EAS secret: EXPO_PUBLIC_SUPABASE_ANON_KEY

---

## Build Commands

### iOS TestFlight
```
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

### Android Internal Track
```
eas build --platform android --profile production
eas submit --platform android --profile production
```

### Both at Once
```
eas build --platform all --profile production
```

---

## Post-Build QA (Before Public Release)

- [ ] Register on fresh device — new user flow complete
- [ ] Complete onboarding — all steps save correctly
- [ ] Generate workout — AI responds in < 5 seconds
- [ ] Generate meal plan — calories and macros display
- [ ] Upload lab image — analysis returns with disclaimer
- [ ] Generate daily plan — timeline appears correctly
- [ ] Dashboard loads — streak card shows, checklist updates
- [ ] Enable notifications — schedule saves, reminders fire
- [ ] Toggle dark/light mode — all screens update instantly
- [ ] Sign out → sign back in — session restores correctly
- [ ] Progress screen — charts render with real data

---

## Environment Variables (EAS Secrets)

Set via: eas secret:create --name KEY --value VALUE

| Key | Description |
|-----|-------------|
| EXPO_PUBLIC_SUPABASE_URL | Your Supabase project URL |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |
| EXPO_PUBLIC_PROJECT_ID | Expo project ID (for push tokens) |

---

## Supabase Production Checklist

- [ ] RLS enabled on all 11 tables ✅
- [ ] Edge Function ai-workflow deployed ✅
- [ ] OPENAI_API_KEY secret set ✅
- [ ] Storage buckets: lab-reports, avatars created ✅
- [ ] Auth: Email/password provider enabled
- [ ] Auth: Redirect URLs set for deep linking

---

## App Store Assets Needed

- [ ] App icon 1024x1024 PNG (no alpha)
- [ ] 3x iPhone screenshots (6.9" display)
- [ ] 3x iPad screenshots (if tablet enabled)
- [ ] Short description (max 170 chars)
- [ ] Full description
- [ ] Keywords (max 100 chars)
- [ ] Privacy Policy URL
- [ ] Support URL

