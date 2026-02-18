# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ATP Rank — a closed-group Mario Tennis ranking app for friends. Tracks Elo-based rankings, match results (win/lose only), player challenges, and single-elimination tournaments.

**Stack**: Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + Supabase (auth + DB) + Bun

**Design**: Dark theme default, orange accents, Duolingo-inspired UI (chunky buttons, rounded corners, playful feel).

## Commands

```bash
bun dev          # Start dev server (localhost:3000)
bun run build    # Production build
bun run start    # Start production server
bun run lint     # ESLint (v9, next core-web-vitals + typescript configs)
```

## Architecture

- **App Router** with server components by default — all routes under `app/`
- **Tailwind v4** with shadcn/ui — OKLCH color variables in `app/globals.css`, no tailwind.config file
- **Path alias**: `@/*` maps to project root
- **Fonts**: Geist Sans and Geist Mono via `next/font/google`
- **Auth**: Supabase email/password only via `@supabase/ssr` (not deprecated auth-helpers)
- **Mutations**: Server actions (not API routes) — use `revalidatePath()` for cache invalidation
- **Elo updates**: Atomic via `record_match` PL/pgSQL RPC in Supabase (not in app code)

## Route Groups

- `(public)/` — No auth: leaderboard (home at `/`), recent matches, player profiles
- `(auth)/` — Login/signup pages (centered card layout)
- `(protected)/` — Requires auth: dashboard, record match, challenges, tournaments, profile editing

Middleware at `/middleware.ts` handles session refresh and auth redirects.

## Database (Supabase)

Six tables with RLS: `profiles`, `matches`, `challenges`, `tournaments`, `tournament_participants`, `tournament_matches`. Migration SQL files live in `supabase/migrations/` — run manually via Supabase dashboard/CLI.

Key function: `record_match` RPC — atomically locks player rows, calculates Elo (K=32), inserts match, updates both profiles, handles challenge/tournament linkage.

## Elo System

- K-factor: 32 | Starting: 1200 | Floor: 100
- Pure calculation functions in `lib/elo.ts`
- Actual updates via DB function for atomicity
- Match history stores `winner_elo_before`, `loser_elo_before`, `elo_change` for reconstructing Elo charts

## Key Directories

```
lib/supabase/          — Client (browser + server) and middleware helpers
lib/elo.ts             — Pure Elo calculation functions
lib/tournament.ts      — Bracket generation (single elimination)
lib/types/database.ts  — TypeScript types for all DB tables
components/ui/         — shadcn/ui primitives
components/layout/     — Nav bar, user menu, mobile nav
components/leaderboard/ — Table, row, rank badge
components/matches/    — Card, list, record form
components/challenges/ — Card, list, actions, create form
components/tournaments/ — Card, list, bracket view, form
components/profile/    — Player card, stats grid, Elo chart
components/shared/     — Player select, empty state, skeletons
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=                       # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=   # Supabase publishable key
```

## Conventions

- Closed app for friends — all users see each other, no groups/friends system
- Games tracked as win/lose only (no specific scores)
- Only user-to-user interaction is the challenge system
- Tournaments are single elimination only, seeded by Elo

## Git

- Remote uses SSH host alias `github-personal` (not `github.com`) for the personal GitHub account
