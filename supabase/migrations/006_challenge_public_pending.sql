-- ATP Rank: Make pending challenges publicly visible
-- Extends the RLS policy from 005 to also cover pending challenges,
-- so they appear on the public home page.
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

-- Drop the old policy (from 005)
drop policy if exists "Anyone can view accepted challenges" on public.challenges;

-- Drop in case this migration is re-run
drop policy if exists "Anyone can view pending and accepted challenges" on public.challenges;

-- Create updated policy covering both statuses
create policy "Anyone can view pending and accepted challenges"
  on public.challenges for select
  using (status in ('pending', 'accepted'));
