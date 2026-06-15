# EVX Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Supabase account (free tier works)
- OpenAI API key

## Step 1: Clone and Install

```bash
git clone <repo>
cd evx
npm install
```

## Step 2: Supabase Setup

1. Go to https://supabase.com → Create new project
2. Go to **SQL Editor** → Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_storage_buckets.sql`
4. Go to **Authentication** → Settings → Enable Email auth
5. Copy your `Project URL` and `anon public` key

## Step 3: Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
```

## Step 4: Start Development

```bash
# Start Expo dev server
npm start

# iOS Simulator
npm run ios

# Android Emulator  
npm run android

# Web browser
npm run web
```

## Step 5: Production Build

```bash
# Login to Expo account
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Export for web
npm run build:web
```

## Step 6: Configure Supabase Auth (Optional)

For email confirmation:
1. Supabase Dashboard → Authentication → Email Templates
2. Customize confirmation email with EVX branding

For OAuth (Google, Apple):
1. Supabase Dashboard → Authentication → Providers
2. Enable desired providers and add credentials

## Environment Details

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `EXPO_PUBLIC_OPENAI_API_KEY` | OpenAI API key for AI features |

## AI Features Note

All AI features require an OpenAI API key with GPT-4o access.
Estimated cost: ~$0.01–0.05 per AI generation.
