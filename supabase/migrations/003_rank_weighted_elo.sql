-- ATP Rank: Rank-Weighted Elo System
-- Elo changes now depend on leaderboard position, not just rating difference.
-- Upsets (lower-ranked beating higher-ranked) are rewarded more.
-- Expected wins (higher-ranked beating lower-ranked) are rewarded less.
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

-- ============================================
-- HELPER: GET PLAYER RANK
-- ============================================
-- Returns a player's 1-based rank and total player count.

create or replace function public.get_player_rank(p_player_id uuid)
returns table(rank integer, total_players integer) as $$
begin
  return query
  with ranked as (
    select id, rank() over (order by elo_rating desc) as player_rank,
           count(*) over () as total
    from public.profiles
  )
  select ranked.player_rank::integer, ranked.total::integer
  from ranked
  where ranked.id = p_player_id;
end;
$$ language plpgsql stable security definer;

-- ============================================
-- REPLACE RECORD_MATCH RPC (rank-weighted)
-- ============================================
-- Used for tournament matches (immediate Elo application).
-- Same signature — no app code changes needed.

create or replace function public.record_match(
  p_winner_id uuid,
  p_loser_id uuid,
  p_recorded_by uuid,
  p_challenge_id uuid default null,
  p_tournament_match_id uuid default null
) returns uuid as $$
declare
  v_winner_elo integer;
  v_loser_elo integer;
  v_winner_rank integer;
  v_loser_rank integer;
  v_total integer;
  v_rank_diff integer;
  v_raw_factor float;
  v_multiplier float;
  v_adjusted_k float;
  v_expected float;
  v_change integer;
  v_match_id uuid;
begin
  -- Lock and get current ratings
  select elo_rating into v_winner_elo from public.profiles where id = p_winner_id for update;
  select elo_rating into v_loser_elo from public.profiles where id = p_loser_id for update;

  -- Get ranks (computed from current elo_rating ordering)
  select r.rank, r.total_players into v_winner_rank, v_total
    from public.get_player_rank(p_winner_id) r;
  select r.rank into v_loser_rank
    from public.get_player_rank(p_loser_id) r;

  -- Rank-weighted K-factor: RANK_SCALE=0.5, K_MIN_MULT=0.5, K_MAX_MULT=1.5
  v_rank_diff := v_winner_rank - v_loser_rank;
  v_raw_factor := 1.0 + (v_rank_diff::float / greatest(v_total, 1)::float) * 0.5;
  v_multiplier := least(1.5, greatest(0.5, v_raw_factor));
  v_adjusted_k := 32.0 * v_multiplier;

  -- Elo calculation
  v_expected := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::float / 400.0));
  v_change := greatest(1, round(v_adjusted_k * (1.0 - v_expected)));

  -- Insert match record
  insert into public.matches (winner_id, loser_id, winner_elo_before, loser_elo_before, elo_change, recorded_by, challenge_id, tournament_match_id)
  values (p_winner_id, p_loser_id, v_winner_elo, v_loser_elo, v_change, p_recorded_by, p_challenge_id, p_tournament_match_id)
  returning id into v_match_id;

  -- Update winner
  update public.profiles
  set elo_rating = elo_rating + v_change, wins = wins + 1, updated_at = now()
  where id = p_winner_id;

  -- Update loser (floor at 100)
  update public.profiles
  set elo_rating = greatest(100, elo_rating - v_change), losses = losses + 1, updated_at = now()
  where id = p_loser_id;

  -- Complete challenge if applicable
  if p_challenge_id is not null then
    update public.challenges
    set status = 'completed', completed_at = now()
    where id = p_challenge_id;
  end if;

  -- Update tournament match if applicable
  if p_tournament_match_id is not null then
    update public.tournament_matches
    set winner_id = p_winner_id, match_id = v_match_id
    where id = p_tournament_match_id;
  end if;

  return v_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- REPLACE CREATE_PENDING_MATCH RPC (rank-weighted)
-- ============================================
-- Preview estimate stored on the match; real calculation at confirm time.

create or replace function public.create_pending_match(
  p_winner_id uuid,
  p_loser_id uuid,
  p_recorded_by uuid,
  p_challenge_id uuid default null
) returns uuid as $$
declare
  v_winner_elo integer;
  v_loser_elo integer;
  v_winner_rank integer;
  v_loser_rank integer;
  v_total integer;
  v_rank_diff integer;
  v_raw_factor float;
  v_multiplier float;
  v_adjusted_k float;
  v_expected float;
  v_change integer;
  v_match_id uuid;
begin
  -- Get current ratings (no lock needed, just reading for preview)
  select elo_rating into v_winner_elo from public.profiles where id = p_winner_id;
  select elo_rating into v_loser_elo from public.profiles where id = p_loser_id;

  -- Get ranks
  select r.rank, r.total_players into v_winner_rank, v_total
    from public.get_player_rank(p_winner_id) r;
  select r.rank into v_loser_rank
    from public.get_player_rank(p_loser_id) r;

  -- Rank-weighted K-factor
  v_rank_diff := v_winner_rank - v_loser_rank;
  v_raw_factor := 1.0 + (v_rank_diff::float / greatest(v_total, 1)::float) * 0.5;
  v_multiplier := least(1.5, greatest(0.5, v_raw_factor));
  v_adjusted_k := 32.0 * v_multiplier;

  -- Elo calculation (preview estimate)
  v_expected := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::float / 400.0));
  v_change := greatest(1, round(v_adjusted_k * (1.0 - v_expected)));

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

  return v_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- REPLACE CONFIRM_MATCH RPC (recalculates at confirm time)
-- ============================================
-- Recalculates Elo with current ratings and ranks for fairness.

create or replace function public.confirm_match(
  p_match_id uuid,
  p_confirmer_id uuid
) returns uuid as $$
declare
  v_match record;
  v_winner_elo integer;
  v_loser_elo integer;
  v_winner_rank integer;
  v_loser_rank integer;
  v_total integer;
  v_rank_diff integer;
  v_raw_factor float;
  v_multiplier float;
  v_adjusted_k float;
  v_expected float;
  v_change integer;
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

  -- Lock player rows and get CURRENT ratings
  select elo_rating into v_winner_elo from public.profiles where id = v_match.winner_id for update;
  select elo_rating into v_loser_elo from public.profiles where id = v_match.loser_id for update;

  -- Recalculate with current ranks
  select r.rank, r.total_players into v_winner_rank, v_total
    from public.get_player_rank(v_match.winner_id) r;
  select r.rank into v_loser_rank
    from public.get_player_rank(v_match.loser_id) r;

  v_rank_diff := v_winner_rank - v_loser_rank;
  v_raw_factor := 1.0 + (v_rank_diff::float / greatest(v_total, 1)::float) * 0.5;
  v_multiplier := least(1.5, greatest(0.5, v_raw_factor));
  v_adjusted_k := 32.0 * v_multiplier;

  v_expected := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::float / 400.0));
  v_change := greatest(1, round(v_adjusted_k * (1.0 - v_expected)));

  -- Update match record with recalculated values
  update public.matches
  set status = 'confirmed',
      confirmed_at = now(),
      winner_elo_before = v_winner_elo,
      loser_elo_before = v_loser_elo,
      elo_change = v_change
  where id = p_match_id;

  -- Apply Elo changes
  update public.profiles
  set elo_rating = elo_rating + v_change, wins = wins + 1, updated_at = now()
  where id = v_match.winner_id;

  update public.profiles
  set elo_rating = greatest(100, elo_rating - v_change), losses = losses + 1, updated_at = now()
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
