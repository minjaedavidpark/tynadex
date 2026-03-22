# TogeDex

A mobile app for Pokemon TCG collectors to manage their card binders, discover nearby traders, and facilitate trades — all from their phone.

## Features

- **Online Binder Portfolio** — Digitize your card collection with a binder-style UI
- **Nearby Traders** — Find other collectors near you (approximate location)
- **Card Recommendations** — Get suggestions for missing slots in your binder
- **Card Scanner** — Upload front/back photos to add cards to your binder
- **User Reviews** — Trust ratings so you know who to trade with
- **Trading & Messaging** — Tag cards as tradeable/for sale and message other users
- **Wishlist** — Track the cards you're looking for
- **Market Prices** — View basic price info for each card
- **Card Database** — Search the full Pokemon TCG catalog

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | Expo + React Native + TypeScript |
| Routing | Expo Router |
| Backend | Supabase |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Image Storage | Supabase Storage |
| Offline Cache | Expo SQLite |
| Server Logic | Supabase Edge Functions |
| Data Fetching | TanStack Query |
| State Management | Zustand |
| External APIs | [Scrydex](https://scrydex.com/), [eBay API](https://developer.ebay.com/), OCR, Native Location Services |

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (macOS) and/or Android Emulator
- [Expo Go](https://expo.dev/go) app on your physical device (optional)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/minjaedavidpark/togedex.git
cd togedex

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key in .env

# Start the dev server
npx expo start
```

### Environment Variables

Create a `.env` file at the root (it is gitignored):

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Find these values in your [Supabase dashboard](https://supabase.com/dashboard) under **Project Settings → API**.

Scan the QR code with Expo Go (Android) or the Camera app (iOS) to open on your device.

## Testing

**Unit tests** (query parsing, cache key, TCGdex URL building — no network):

```bash
npm test
```

**Edge Function integration tests** (optional — needs local Supabase + `supabase functions serve`):

```bash
# PowerShell example
$env:SUPABASE_FUNCTIONS_TEST_BASE="http://127.0.0.1:54321/functions/v1"
$env:SUPABASE_FUNCTIONS_TEST_ANON_KEY="<Publishable key from npx supabase status>"
npm run test:integration
```

If those env vars are unset, integration tests are skipped.

## Project Structure

```
togedex/
├── app/                # Expo Router screens & layouts
├── assets/             # Images, fonts, static files
├── components/         # Reusable UI components
├── constants/          # App-wide constants (colors, config)
├── hooks/              # Custom React hooks
├── lib/                # Supabase client, API helpers
├── store/              # Zustand stores
├── types/              # Shared TypeScript types
├── tests/              # Vitest (Edge helpers + integration)
├── supabase/           # Migrations + Edge Functions (`_shared` helpers)
└── utils/              # Utility functions
```

## License

All rights reserved. This is a private project.
