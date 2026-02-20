# Season Management Guide

This document provides step-by-step instructions for managing seasons in ATP Rank.

## Overview

Seasons run on a monthly/30-day basis. At the end of each season:
- Top 3 players by Elo receive gold/silver/bronze medals
- Player with most wins receives MVP medal
- All Elo ratings reset to 1200
- Season wins/losses reset to 0 (all-time stats preserved)
- Match history is cleared

---

## Creating a New Season

### Step 1: Add Season to Database

Run this SQL in the Supabase SQL Editor:

```sql
INSERT INTO public.seasons (name, slug, description, status, starts_at, ends_at, created_by)
VALUES (
  'Season 2: Rising Stars',           -- Display name
  's2-rising-stars',                  -- URL-safe slug (must be unique)
  'The competition heats up!',        -- Optional description
  'upcoming',                         -- Start as 'upcoming'
  '2024-02-01 00:00:00+00',          -- Season start date
  '2024-02-29 23:59:59+00',          -- Season end date
  'YOUR_USER_UUID_HERE'               -- Your profile UUID (or NULL)
);
```

### Step 2: Create Season Assets Folder

Create a new folder in the codebase:

```
components/seasons/season-specifics/s2-rising-stars/
├── hero.tsx              # Season hero component
├── medal-gold.svg        # Gold medal SVG
├── medal-silver.svg      # Silver medal SVG
├── medal-bronze.svg      # Bronze medal SVG
└── medal-mvp.svg         # MVP medal SVG
```

### Step 3: Create Hero Component

Create `hero.tsx` with your custom design:

```tsx
"use client";

export default function S2RisingStarsHero() {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950/50 via-background to-background border border-blue-500/20">
      {/* Your custom design here */}
      <div className="relative px-6 py-8 sm:px-8 sm:py-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-400">
          <span>Season 2</span>
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Rising Stars
          </span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          The competition heats up!
        </p>
      </div>
    </div>
  );
}
```

### Step 4: Add Medal SVGs

Create the 4 medal SVG files in your season folder. Each SVG should be approximately 48x48px.

### Step 5: Register Season in Index

Update `components/seasons/season-specifics/index.ts`:

```typescript
const seasonHeroes: Record<string, () => Promise<{ default: ComponentType }>> = {
  "s1-genesis": () => import("./s1-genesis/hero"),
  "s2-rising-stars": () => import("./s2-rising-stars/hero"),  // Add this
};

const seasonMedals: Record<string, SeasonMedalAssets> = {
  "s1-genesis": { ... },
  "s2-rising-stars": {  // Add this
    gold: "/seasons/s2-rising-stars/medal-gold.svg",
    silver: "/seasons/s2-rising-stars/medal-silver.svg",
    bronze: "/seasons/s2-rising-stars/medal-bronze.svg",
    mvp: "/seasons/s2-rising-stars/medal-mvp.svg",
  },
};
```

### Step 6: Add Public Medal Assets

Copy your medal SVGs to the public folder:

```
public/seasons/s2-rising-stars/
├── medal-gold.svg
├── medal-silver.svg
├── medal-bronze.svg
└── medal-mvp.svg
```

---

## Starting a Season

When ready to start the new season, run this SQL:

```sql
SELECT public.start_season('SEASON_UUID_HERE');
```

This will:
- Mark any currently active season as completed
- Set the new season to 'active'

---

## Ending a Season

When the season ends, run this SQL:

```sql
SELECT public.end_season('SEASON_UUID_HERE');
```

This will automatically:
1. Award gold medal to rank #1 by Elo
2. Award silver medal to rank #2 by Elo
3. Award bronze medal to rank #3 by Elo
4. Award MVP medal to player with most wins
5. Delete all matches
6. Reset all profiles:
   - `elo_rating` → 1200
   - `wins` → 0
   - `losses` → 0
   - `total_wins` and `total_losses` are preserved
7. Mark season as 'completed'

---

## Verification Checklist

After creating a new season:

- [ ] Season appears in database with correct dates
- [ ] Hero component renders on home page when season is active
- [ ] All 4 medal SVGs load correctly
- [ ] Season slug is registered in `index.ts`
- [ ] No TypeScript errors (`bun run build`)
- [ ] No lint errors (`bun run lint`)

After ending a season:

- [ ] Hall of Fame page shows the completed season
- [ ] Winners display with correct medals
- [ ] All player Elo ratings are 1200
- [ ] All player season wins/losses are 0
- [ ] All-time stats remain intact
- [ ] Match history is cleared

---

## Troubleshooting

### Hero not showing
- Check season status is 'active'
- Verify slug matches between database and `index.ts`
- Check browser console for import errors

### Medals not loading
- Verify SVG files exist in `public/seasons/{slug}/`
- Check file paths match `index.ts` configuration
- Clear browser cache

### Season not starting
- Ensure season status is 'upcoming' before calling `start_season`
- Check season UUID is correct

### Season not ending
- Ensure season status is 'active' before calling `end_season`
- Check for database errors in Supabase logs

---

## Future Improvements

- [ ] Admin UI for season management
- [ ] Automated cron job for season transitions
- [ ] Season statistics and analytics page
- [ ] Custom leaderboard filtering by season
