-- ATP Rank: Doubles Tournaments
-- Adds 2v2 tournament support. Players join with a partner.
-- Team Elo = sum of individual Elos for seeding.
-- Uses record_doubles_match RPC for match recording.
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

-- ============================================
-- ALTER TOURNAMENTS TABLE
-- ============================================
alter table public.tournaments
  add column match_type public.match_type not null default 'singles';

-- ============================================
-- ALTER TOURNAMENT_PARTICIPANTS TABLE
-- ============================================
-- For doubles, each participant row is a team (player + partner).
alter table public.tournament_participants
  add column partner_id uuid references public.profiles(id) on delete set null;

-- ============================================
-- ALTER TOURNAMENT_MATCHES TABLE
-- ============================================
-- Partner columns for each bracket slot, plus the winner's partner for advancement.
alter table public.tournament_matches
  add column player1_partner_id uuid references public.profiles(id) on delete set null,
  add column player2_partner_id uuid references public.profiles(id) on delete set null,
  add column winner_partner_id uuid references public.profiles(id) on delete set null;
