# Civil Estimation Pro

Vite + React SPA with an Express dev server, PostgreSQL (Prisma), TanStack Query, Zustand, and a Gemini-backed structural assistant (server-only API key).

## Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL) — optional; without DB, UI still runs but APIs return 503.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (server only). Set `DATABASE_URL` when using Postgres (see `docker-compose.yml`).
3. Start database: `npm run db:up`
4. Apply schema: `npm run db:migrate` (or `npx prisma migrate deploy` in CI)
5. Seed IS standards + demo org: `npm run db:seed`
6. Dev: `npm run dev` — opens `http://localhost:3000`

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Express + Vite middleware |
| `npm run build` / `npm start` | Production client + server |
| `npm run test` | Vitest (domain + schema) |
| `npm run test:e2e` | Playwright (starts dev server) |
| `npm run db:up` | `docker compose up -d` |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:seed` | Seed data |

## Security

- Do not put `GEMINI_API_KEY` in Vite `define` or client code; only `server/` reads it.
- Protected APIs expect `Authorization: Bearer dev:<userId>` from `POST /api/auth/dev-session`, or a Supabase JWT if `SUPABASE_JWT_SECRET` is set.

## AI Studio

Legacy link: https://ai.studio/apps/40250d51-c04e-4652-a422-b78ebc9a8f0c
