-- ATP Rank: Match Confirmation System
-- Run this migration in your Supabase SQL editor

-- ============================================
-- ADD STATUS TO MATCHES
-- ============================================

-- Create enum for match status
create type public.match_status as enum ('pending', 'confirmed', 'declined');

-- Add status column (default 'confirmed' for existing matches)
alter table public.matches
  add column status public.match_status not null default 'confirmed';

-- Add confirmed_at timestamp
alter table public.matches
  add column confirmed_at timestamptz;

-- Update existing matches to have confirmed_at = played_at
update public.matches set confirmed_at = played_at where status = 'confirmed';

-- Add index for pending matches lookup
create index idx_matches_status on public.matches(status);
create index idx_matches_pending_opponent on public.matches(winner_id, loser_id) where status = 'pending';

-- ============================================
-- CREATE PENDING MATCH RPC
-- ============================================
-- Creates a match with status='pending', no Elo changes yet
-- Elo values are locked at recording time for consistency

create or replace function public.create_pending_match(
  p_winner_id uuid,
  p_loser_id uuid,
  p_recorded_by uuid,
  p_challenge_id uuid default null
) returns uuid as $$
declare
  v_winner_elo integer;
  v_loser_elo integer;
  v_expected float;
  v_change integer;
  v_match_id uuid;
begin
  -- Get current ratings (no lock needed, just reading for calculation)
  select elo_rating into v_winner_elo from public.profiles where id = p_winner_id;
  select elo_rating into v_loser_elo from public.profiles where id = p_loser_id;

  -- Calculate Elo change (K=32) - stored for when match is confirmed
  v_expected := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::float / 400.0));
  v_change := greatest(1, round(32 * (1.0 - v_expected)));

  -- Insert match record with pending status
  insert into public.matches (
    winner_id, loser_id, winner_elo_before, loser_elo_before,
    elo_change, recorded_by, challenge_id, status
  )
  values (
    p_winner_id, p_loser_id, v_winner_elo, v_loser_elo,
    v_change, p_recorded_by, p_challenge_id, 'pending'
  )
  returning id into v_match_id;

  -- Note: No Elo updates, no win/loss count changes yet
  -- These happen when match is confirmed

  return v_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- CONFIRM MATCH RPC
-- ============================================
-- Confirms a pending match and applies Elo changes

create or replace function public.confirm_match(
  p_match_id uuid,
  p_confirmer_id uuid
) returns uuid as $$
declare
  v_match record;
begin
  -- Get and lock the match
  select * into v_match
  from public.matches
  where id = p_match_id
  for update;

  -- Validate match exists
  if v_match is null then
    raise exception 'Match not found';
  end if;

  -- Validate match is pending
  if v_match.status != 'pending' then
    raise exception 'Match is not pending confirmation';
  end if;

  -- Validate confirmer is one of the players (but not the recorder)
  if p_confirmer_id != v_match.winner_id and p_confirmer_id != v_match.loser_id then
    raise exception 'Only match participants can confirm';
  end if;

  if p_confirmer_id = v_match.recorded_by then
    raise exception 'The person who recorded the match cannot confirm it';
  end if;

  -- Lock player rows for update
  perform id from public.profiles where id = v_match.winner_id for update;
  perform id from public.profiles where id = v_match.loser_id for update;

  -- Update match status
  update public.matches
  set status = 'confirmed', confirmed_at = now()
  where id = p_match_id;

  -- Apply Elo changes using stored values
  update public.profiles
  set elo_rating = elo_rating + v_match.elo_change, wins = wins + 1, updated_at = now()
  where id = v_match.winner_id;

  update public.profiles
  set elo_rating = greatest(100, elo_rating - v_match.elo_change), losses = losses + 1, updated_at = now()
  where id = v_match.loser_id;

  -- Complete challenge if applicable
  if v_match.challenge_id is not null then
    update public.challenges
    set status = 'completed', completed_at = now()
    where id = v_match.challenge_id;
  end if;

  return p_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- DECLINE MATCH RPC
-- ============================================
-- Declines a pending match (no Elo changes)

create or replace function public.decline_match(
  p_match_id uuid,
  p_decliner_id uuid
) returns uuid as $$
declare
  v_match record;
begin
  -- Get the match
  select * into v_match
  from public.matches
  where id = p_match_id;

  -- Validate match exists
  if v_match is null then
    raise exception 'Match not found';
  end if;

  -- Validate match is pending
  if v_match.status != 'pending' then
    raise exception 'Match is not pending';
  end if;

  -- Validate decliner is one of the players (but not the recorder)
  if p_decliner_id != v_match.winner_id and p_decliner_id != v_match.loser_id then
    raise exception 'Only match participants can decline';
  end if;

  if p_decliner_id = v_match.recorded_by then
    raise exception 'The person who recorded the match cannot decline it';
  end if;

  -- Update match status to declined
  update public.matches
  set status = 'declined'
  where id = p_match_id;

  return p_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- UPDATE RLS POLICIES FOR MATCHES
-- ============================================

-- Allow users to update matches they're involved in (for confirm/decline)
create policy "Involved users can update matches"
  on public.matches for update
  using (auth.uid() = winner_id or auth.uid() = loser_id);
