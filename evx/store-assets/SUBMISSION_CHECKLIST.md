# EVX — App Store Submission Checklist

## Before You Build

### Apple Developer Account
- [ ] Active Apple Developer Program membership ($99/yr)
- [ ] App created in App Store Connect: https://appstoreconnect.apple.com
- [ ] Bundle ID registered: com.evx.healthcoach
- [ ] Note your: Apple ID, ASC App ID, Apple Team ID

### Google Play Console
- [ ] Active Google Play Developer account ($25 one-time)
- [ ] App created in Play Console: https://play.google.com/console
- [ ] Package name registered: com.evx.healthcoach
- [ ] Service account JSON downloaded for EAS submit

### EAS (Expo Application Services)
- [ ] EAS account created: https://expo.dev
- [ ] `npm install -g eas-cli`
- [ ] `eas login`
- [ ] `eas build:configure` (run inside /evx folder)
- [ ] Update eas.json with your real Apple ID, ASC App ID, Team ID

---

## Environment Setup

### Supabase Secrets
- [ ] `OPENAI_API_KEY` set in Supabase Edge Function secrets
- [ ] Edge function `ai-workflow` deployed and live
- [ ] All 13 database tables confirmed in production

### App Config (app.json)
- [ ] `extra.eas.projectId` = your real EAS project ID
- [ ] `updates.url` = your real Expo updates URL
- [ ] Version: 1.0.0 / Build: 1

---

## Required Assets

### iOS
- [ ] App icon: 1024x1024 PNG (no alpha, no rounded corners)
- [ ] Screenshots: iPhone 6.9" (1320x2868) — min 3, max 10
- [ ] Screenshots: iPhone 6.5" (1242x2688) — required
- [ ] iPad screenshots (if tablet supported)

### Android
- [ ] App icon: 512x512 PNG
- [ ] Feature graphic: 1024x500 PNG
- [ ] Screenshots: phone (min 2, max 8)
- [ ] google-services.json file in /evx root

---

## App Store Connect Setup

### App Information
- [ ] App name: EVX Health Coach
- [ ] Subtitle: AI Fitness, Nutrition & Labs
- [ ] Category: Health & Fitness
- [ ] Privacy Policy URL: https://evxhealth.com/privacy
- [ ] Support URL: https://evxhealth.com/support

### Age Rating
- [ ] Set to 17+ (Medical/Treatment Information)

### Privacy Nutrition Labels (Apple)
- [ ] Health & Fitness: Used for App Functionality
- [ ] Contact Info (email): Account creation
- [ ] Usage Data: Analytics (not linked to identity)

### In-App Purchases (if any)
- [ ] N/A for v1.0 — free app

---

## Build Commands

### iOS Production Build
```
cd evx
eas build --platform ios --profile production
```

### Android Production Build
```
cd evx
eas build --platform android --profile production
```

### Submit to App Store (after build)
```
eas submit --platform ios --profile production
```

### Submit to Google Play (after build)
```
eas submit --platform android --profile production
```

---

## HealthKit Review Notes (Apple)
Apple requires justification for HealthKit usage.
In App Review notes write:
"EVX reads step count, heart rate, sleep data, and active calories from HealthKit to personalise AI-generated workout and nutrition recommendations. Users explicitly grant this permission during onboarding. No health data is shared with third parties."

---

## TestFlight Beta (Recommended First)
1. Build with `eas build --platform ios --profile preview`
2. Upload to TestFlight via EAS submit or Transporter
3. Add internal testers (up to 100)
4. Test all critical flows before production submission

---

## Final Pre-Submission QA
- [ ] Auth flow (signup, login, logout)
- [ ] Onboarding completes without errors
- [ ] AI workout generates successfully
- [ ] AI nutrition generates successfully
- [ ] Lab upload works (PDF + image)
- [ ] Daily plan generates
- [ ] Progress logging works
- [ ] Push notification permission prompt appears
- [ ] HealthKit permission prompt appears (iOS)
- [ ] Dark/light mode toggle works
- [ ] App works offline (shows cached data)
- [ ] No crashes on iPhone 15, iPhone SE

