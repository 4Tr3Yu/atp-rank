# RIA ATP Rank

A closed-group Mario Tennis ranking app for friends. Tracks Elo-based rankings, match results (win/lose only), player challenges, and single-elimination tournaments.

**Live**: Deployed on Vercel

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (OKLCH color system)
- **Backend**: Supabase (Auth + PostgreSQL)
- **Runtime**: Bun
- **Design**: Dark theme, orange accents, Duolingo-inspired 3D buttons

## Features

- **Leaderboard** — Live Elo rankings with gold/silver/bronze badges
- **Match Recording** — Log wins/losses with Elo preview, pending confirmation from opponent
- **Challenges** — Challenge friends to matches, accept/decline/cancel
- **Tournaments** — Single elimination brackets, seeded by Elo, with bye handling
- **Player Profiles** — Stats, match history, Elo chart over time
- **Dashboard** — Quick stats, pending matches, recent activity

## Architecture

```
app/
├── (public)/           # No auth: leaderboard (/), matches, player profiles
├── (auth)/             # Login/signup (centered card layout)
├── (protected)/        # Requires auth: dashboard, matches, challenges,
│                       #   tournaments, profile
├── layout.tsx          # Root: dark theme, fonts, providers
└── middleware.ts       # Session refresh + auth redirects
```

### Key Patterns

- **Server Components** by default — client components only where interactivity is needed
- **Server Actions** for mutations (no API routes) — `revalidatePath()` for cache invalidation
- **Atomic Elo updates** via `record_match` PL/pgSQL function in Supabase (locks rows, calculates Elo, updates profiles in a single transaction)
- **Match confirmation** — recorded matches require opponent confirmation before Elo updates
- **Responsive modals** — Dialog on desktop, bottom Sheet on mobile via `useMediaQuery`
- **Global loader** — Bouncing tennis ball overlay using `useOptimistic` to work with React transitions

### Database

Six tables with Row Level Security:

| Table | Purpose |
|-------|---------|
| `profiles` | Extends auth.users — username, display name, Elo rating, W/L |
| `matches` | Every game played — stores Elo snapshots for history |
| `challenges` | User-to-user match challenges (pending/accepted/declined/completed) |
| `tournaments` | Tournament containers (draft/open/in_progress/completed) |
| `tournament_participants` | Join table with seeds and elimination status |
| `tournament_matches` | Bracket slots with round/position |

Migrations live in `supabase/migrations/`.

### Elo System

- **K-factor**: 32 (casual, meaningful swings)
- **Starting rating**: 1200
- **Floor**: 100
- Pure functions in `lib/elo.ts`, actual updates via DB RPC for atomicity

### Key Directories

```
lib/
├── supabase/           # Browser + server clients, middleware helper
├── elo.ts              # Pure Elo calculation functions
├── tournament.ts       # Bracket generation (single elimination)
├── fonts.ts            # Local font loading (Zen Dots, Geist)
├── loading-context.tsx # Global loader state (useOptimistic)
└── types/database.ts   # TypeScript types for all DB tables

components/
├── ui/                 # shadcn/ui primitives (3D button variants)
├── layout/             # Nav bar, mobile nav, footer, background decoration
├── leaderboard/        # Table, row, rank badge
├── matches/            # Card, list, record form, pending confirmation
├── challenges/         # Card, list, actions, create form
├── tournaments/        # Card, list, bracket view, form, actions
├── profile/            # Player card, stats grid, Elo chart
└── shared/             # Player select, back button, global loader
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- A [Supabase](https://supabase.com/) project

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone git@github.com:4Tr3Yu/atp-rank.git
   cd atp-rank
   bun install
   ```

2. Create `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
   ```

3. Run the database migrations from `supabase/migrations/` in your Supabase dashboard or CLI.

4. Start the dev server:
   ```bash
   bun dev
   ```

### Commands

```bash
bun dev          # Start dev server (localhost:3000)
bun run build    # Production build
bun run start    # Start production server
bun run lint     # ESLint
```
