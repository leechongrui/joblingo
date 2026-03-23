# JobLingo 面试答

MVP scaffold for a Mandarin interview prep app that turns a pasted job description
into a curated study deck.

## Stack

- `mobile`: Expo + React Native + TypeScript
- `backend`: Express 5 + TypeScript
- AI: Google GenAI SDK (Gemini)
- Cache: Redis (optional)
- Storage + Auth: Supabase

## Current MVP flows implemented

- Input screen for company, role, job description, optional resume
- Deck generation via `POST /api/generate-deck`
- Deck overview with card list
- Card study screen with front/back flip
- Self-marking as `Got it` / `Need practice`
- Need-practice filter on deck overview
- Local status persistence with AsyncStorage
- Supabase email/password sign-in and protected deck generation

## Project structure

```txt
.
├── backend
│   ├── src
│   │   ├── routes/deckRoutes.ts
│   │   ├── services/{auth,deckService,gemini,cache,supabase}.ts
│   │   ├── config/env.ts
│   │   └── index.ts
│   └── supabase/schema.sql
└── mobile
    ├── app/{index.tsx,_layout.tsx,sign-in.tsx}
    ├── app/deck/{index.tsx,study.tsx}
    ├── components/{DeckCard,StudyCard}.tsx
    ├── providers/AuthProvider.tsx
    └── services/storage/types
```

## Setup

1) Install dependencies from repo root:

```bash
npm install
```

2) Backend env (`backend/.env`):

```bash
cp backend/.env.example backend/.env
```

Set these values:

- `GEMINI_API_KEY`: enables live generation
- `SUPABASE_URL`: your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: backend token verification + persistence
- `REDIS_URL` (optional): enables caching

3) Mobile env (`mobile/.env`):

```bash
cp mobile/.env.example mobile/.env
```

Set:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL` (optional override)

4) Create Supabase tables:

- Run SQL in `backend/supabase/schema.sql`

5) Enable Supabase email/password auth:

- Supabase Dashboard -> Authentication -> Providers -> Email -> Enable

6) Run backend:

```bash
npm run dev:backend
```

7) Run mobile with Expo Go QR:

```bash
npm run start --workspace mobile
```

Then scan the QR code in Expo Go on your phone.

## Deploy backend on Render

1) Push this repo to GitHub.

2) In Render, create a new **Blueprint** service and select this repo.

3) Render will detect `render.yaml` and create `joblingo-backend`.

4) In Render service env vars, set secrets:

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL` (optional)

5) Deploy and copy your backend URL, e.g. `https://joblingo-backend.onrender.com`.

6) In `mobile/.env`, set:

```bash
EXPO_PUBLIC_API_BASE_URL=https://joblingo-backend.onrender.com/api
```

7) Restart Expo:

```bash
npm run start --workspace mobile -- --tunnel
```

Now testers can scan the QR code in Expo Go even if they are not on your Wi-Fi.

## Redis setup

- Redis is optional; without it, app still works.
- Create a Redis database (Upstash/Redis Cloud) and copy connection URL.
- Put URL into backend env as `REDIS_URL`.
- For TLS endpoints, use `rediss://...`.
- Redeploy backend after setting env var.

## Notes

- If Gemini key is missing, backend returns a fallback mock deck so UI remains testable.
- API base URL auto-resolves to `http://<expo-host-lan-ip>:4000/api` when running on Expo Go.
- You can override API base URL with `EXPO_PUBLIC_API_BASE_URL`.
- `POST /api/generate-deck` now requires a valid Supabase user bearer token.
