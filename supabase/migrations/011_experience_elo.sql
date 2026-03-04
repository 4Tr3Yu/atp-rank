-- ATP Rank: Experience-Based K-Factor for Elo System
-- Scales Elo changes per-player based on total match count (all-time).
-- More games = higher multiplier (veteran, max stake).
-- Fewer games = lower multiplier (newbie, protected).
-- Asymmetric: winner and loser each get their own multiplier.
--
-- Formula: exp_multiplier(total_matches) = min(1.4, 0.6 + total_matches / 30)
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

-- ============================================
-- ADD LOSER_ELO_CHANGE COLUMN
-- ============================================
-- Winner's gain stored in elo_change (existing), loser's loss in loser_elo_change.
-- NULL for old rows → app falls back to loser_elo_change ?? elo_change.
alter table public.matches add column loser_elo_change integer;

-- ============================================
-- HELPER: EXPERIENCE MULTIPLIER
-- ============================================
create or replace function public.calc_exp_multiplier(p_total_matches integer)
returns float as $$
begin
  return least(1.4, 0.6 + p_total_matches::float / 30.0);
end;
$$ language plpgsql immutable;

-- ============================================
-- REPLACE RECORD_MATCH RPC (experience-weighted)
-- ============================================
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
  v_base_change integer;
  v_winner_total integer;
  v_loser_total integer;
  v_winner_exp float;
  v_loser_exp float;
  v_winner_change integer;
  v_loser_change integer;
  v_match_id uuid;
  v_season_id uuid;
begin
  v_season_id := public.get_active_season_id();

  -- Lock and get current ratings + total matches
  select elo_rating, total_wins + total_losses
    into v_winner_elo, v_winner_total
    from public.profiles where id = p_winner_id for update;
  select elo_rating, total_wins + total_losses
    into v_loser_elo, v_loser_total
    from public.profiles where id = p_loser_id for update;

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

  -- Base Elo change (before experience scaling)
  v_expected := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::float / 400.0));
  v_base_change := greatest(1, round(v_adjusted_k * (1.0 - v_expected)));

  -- Experience multipliers (asymmetric)
  v_winner_exp := public.calc_exp_multiplier(v_winner_total);
  v_loser_exp := public.calc_exp_multiplier(v_loser_total);
  v_winner_change := greatest(1, round(v_base_change * v_winner_exp));
  v_loser_change := greatest(1, round(v_base_change * v_loser_exp));

  -- Insert match record
  insert into public.matches (
    winner_id, loser_id, winner_elo_before, loser_elo_before,
    elo_change, loser_elo_change, recorded_by, challenge_id,
    tournament_match_id, season_id, match_type, status
  )
  values (
    p_winner_id, p_loser_id, v_winner_elo, v_loser_elo,
    v_winner_change, v_loser_change, p_recorded_by, p_challenge_id,
    p_tournament_match_id, v_season_id, 'singles', 'confirmed'
  )
  returning id into v_match_id;

  -- Update winner (season + total)
  update public.profiles
  set elo_rating = elo_rating + v_winner_change,
      wins = wins + 1,
      total_wins = total_wins + 1,
      updated_at = now()
  where id = p_winner_id;

  -- Update loser (floor at 100, season + total)
  update public.profiles
  set elo_rating = greatest(100, elo_rating - v_loser_change),
      losses = losses + 1,
      total_losses = total_losses + 1,
      updated_at = now()
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
-- REPLACE CREATE_PENDING_MATCH RPC (experience-weighted)
-- ============================================
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
  v_base_change integer;
  v_winner_total integer;
  v_loser_total integer;
  v_winner_exp float;
  v_loser_exp float;
  v_winner_change integer;
  v_loser_change integer;
  v_match_id uuid;
  v_season_id uuid;
begin
  v_season_id := public.get_active_season_id();

  -- Get current ratings + total matches (no lock, preview only)
  select elo_rating, total_wins + total_losses
    into v_winner_elo, v_winner_total
    from public.profiles where id = p_winner_id;
  select elo_rating, total_wins + total_losses
    into v_loser_elo, v_loser_total
    from public.profiles where id = p_loser_id;

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

  -- Base Elo change
  v_expected := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::float / 400.0));
  v_base_change := greatest(1, round(v_adjusted_k * (1.0 - v_expected)));

  -- Experience multipliers (asymmetric)
  v_winner_exp := public.calc_exp_multiplier(v_winner_total);
  v_loser_exp := public.calc_exp_multiplier(v_loser_total);
  v_winner_change := greatest(1, round(v_base_change * v_winner_exp));
  v_loser_change := greatest(1, round(v_base_change * v_loser_exp));

  -- Insert match record with pending status
  insert into public.matches (
    winner_id, loser_id, winner_elo_before, loser_elo_before,
    elo_change, loser_elo_change, recorded_by, challenge_id,
    status, season_id, match_type
  )
  values (
    p_winner_id, p_loser_id, v_winner_elo, v_loser_elo,
    v_winner_change, v_loser_change, p_recorded_by, p_challenge_id,
    'pending', v_season_id, 'singles'
  )
  returning id into v_match_id;

  return v_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- REPLACE CONFIRM_MATCH RPC (experience-weighted)
-- ============================================
create or replace function public.confirm_match(
  p_match_id uuid,
  p_confirmer_id uuid
) returns uuid as $$
declare
  v_match record;
  -- singles vars
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
  v_base_change integer;
  v_winner_total integer;
  v_loser_total integer;
  v_winner_exp float;
  v_loser_exp float;
  v_winner_change integer;
  v_loser_change integer;
  -- doubles vars
  v_team_winner_elo integer;
  v_team_loser_elo integer;
  v_team_change integer;
  v_is_participant boolean;
  v_w1_id uuid;
  v_w2_id uuid;
  v_l1_id uuid;
  v_l2_id uuid;
  v_w1_elo integer;
  v_w2_elo integer;
  v_l1_elo integer;
  v_l2_elo integer;
  v_w1_total integer;
  v_w2_total integer;
  v_l1_total integer;
  v_l2_total integer;
  v_w1_exp float;
  v_w2_exp float;
  v_l1_exp float;
  v_l2_exp float;
  v_w1_change integer;
  v_w2_change integer;
  v_l1_change integer;
  v_l2_change integer;
  v_player_change integer;
begin
  -- Get and lock the match
  select * into v_match
  from public.matches
  where id = p_match_id
  for update;

  if v_match is null then
    raise exception 'Match not found';
  end if;

  if v_match.status != 'pending' then
    raise exception 'Match is not pending confirmation';
  end if;

  if v_match.match_type = 'doubles' then
    -- ========== DOUBLES CONFIRMATION ==========

    select exists(
      select 1 from public.match_players
      where match_id = p_match_id and player_id = p_confirmer_id
    ) into v_is_participant;

    if not v_is_participant then
      raise exception 'Only match participants can confirm';
    end if;

    if p_confirmer_id = v_match.recorded_by then
      raise exception 'The person who recorded the match cannot confirm it';
    end if;

    -- Get player IDs from match_players
    select player_id into v_w1_id from public.match_players
      where match_id = p_match_id and team = 'winner' order by player_id limit 1;
    select player_id into v_w2_id from public.match_players
      where match_id = p_match_id and team = 'winner' order by player_id offset 1 limit 1;
    select player_id into v_l1_id from public.match_players
      where match_id = p_match_id and team = 'loser' order by player_id limit 1;
    select player_id into v_l2_id from public.match_players
      where match_id = p_match_id and team = 'loser' order by player_id offset 1 limit 1;

    -- Lock and get current Elo + total matches for all 4 players
    select elo_rating, total_wins + total_losses into v_w1_elo, v_w1_total
      from public.profiles where id = v_w1_id for update;
    select elo_rating, total_wins + total_losses into v_w2_elo, v_w2_total
      from public.profiles where id = v_w2_id for update;
    select elo_rating, total_wins + total_losses into v_l1_elo, v_l1_total
      from public.profiles where id = v_l1_id for update;
    select elo_rating, total_wins + total_losses into v_l2_elo, v_l2_total
      from public.profiles where id = v_l2_id for update;

    -- Recalculate with current team Elos
    v_team_winner_elo := v_w1_elo + v_w2_elo;
    v_team_loser_elo := v_l1_elo + v_l2_elo;

    v_expected := 1.0 / (1.0 + power(10.0, (v_team_loser_elo - v_team_winner_elo)::float / 400.0));
    v_team_change := greatest(1, round(32 * (1.0 - v_expected)));
    v_player_change := greatest(1, round(v_team_change::float / 2.0));

    -- Per-player experience multipliers
    v_w1_exp := public.calc_exp_multiplier(v_w1_total);
    v_w2_exp := public.calc_exp_multiplier(v_w2_total);
    v_l1_exp := public.calc_exp_multiplier(v_l1_total);
    v_l2_exp := public.calc_exp_multiplier(v_l2_total);
    v_w1_change := greatest(1, round(v_player_change * v_w1_exp));
    v_w2_change := greatest(1, round(v_player_change * v_w2_exp));
    v_l1_change := greatest(1, round(v_player_change * v_l1_exp));
    v_l2_change := greatest(1, round(v_player_change * v_l2_exp));

    -- Update match record (elo_change = winner1's gain for backward compat)
    update public.matches
    set status = 'confirmed',
        confirmed_at = now(),
        winner_elo_before = v_w1_elo,
        loser_elo_before = v_l1_elo,
        elo_change = v_w1_change,
        loser_elo_change = v_l1_change
    where id = p_match_id;

    -- Update match_players with per-player experience-scaled changes
    update public.match_players
    set elo_before = case player_id
          when v_w1_id then v_w1_elo
          when v_w2_id then v_w2_elo
          when v_l1_id then v_l1_elo
          when v_l2_id then v_l2_elo
        end,
        elo_change = case player_id
          when v_w1_id then v_w1_change
          when v_w2_id then v_w2_change
          when v_l1_id then -v_l1_change
          when v_l2_id then -v_l2_change
        end
    where match_id = p_match_id;

    -- Apply Elo to each player individually (different changes)
    update public.profiles
    set elo_rating = elo_rating + v_w1_change, wins = wins + 1,
        total_wins = total_wins + 1, updated_at = now()
    where id = v_w1_id;

    update public.profiles
    set elo_rating = elo_rating + v_w2_change, wins = wins + 1,
        total_wins = total_wins + 1, updated_at = now()
    where id = v_w2_id;

    update public.profiles
    set elo_rating = greatest(100, elo_rating - v_l1_change), losses = losses + 1,
        total_losses = total_losses + 1, updated_at = now()
    where id = v_l1_id;

    update public.profiles
    set elo_rating = greatest(100, elo_rating - v_l2_change), losses = losses + 1,
        total_losses = total_losses + 1, updated_at = now()
    where id = v_l2_id;

  else
    -- ========== SINGLES CONFIRMATION ==========

    if p_confirmer_id != v_match.winner_id and p_confirmer_id != v_match.loser_id then
      raise exception 'Only match participants can confirm';
    end if;

    if p_confirmer_id = v_match.recorded_by then
      raise exception 'The person who recorded the match cannot confirm it';
    end if;

    -- Lock player rows and get CURRENT ratings + total matches
    select elo_rating, total_wins + total_losses
      into v_winner_elo, v_winner_total
      from public.profiles where id = v_match.winner_id for update;
    select elo_rating, total_wins + total_losses
      into v_loser_elo, v_loser_total
      from public.profiles where id = v_match.loser_id for update;

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
    v_base_change := greatest(1, round(v_adjusted_k * (1.0 - v_expected)));

    -- Experience multipliers (asymmetric)
    v_winner_exp := public.calc_exp_multiplier(v_winner_total);
    v_loser_exp := public.calc_exp_multiplier(v_loser_total);
    v_winner_change := greatest(1, round(v_base_change * v_winner_exp));
    v_loser_change := greatest(1, round(v_base_change * v_loser_exp));

    -- Update match record with recalculated values
    update public.matches
    set status = 'confirmed',
        confirmed_at = now(),
        winner_elo_before = v_winner_elo,
        loser_elo_before = v_loser_elo,
        elo_change = v_winner_change,
        loser_elo_change = v_loser_change
    where id = p_match_id;

    -- Apply Elo changes (season + total)
    update public.profiles
    set elo_rating = elo_rating + v_winner_change,
        wins = wins + 1,
        total_wins = total_wins + 1,
        updated_at = now()
    where id = v_match.winner_id;

    update public.profiles
    set elo_rating = greatest(100, elo_rating - v_loser_change),
        losses = losses + 1,
        total_losses = total_losses + 1,
        updated_at = now()
    where id = v_match.loser_id;
  end if;

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
-- REPLACE RECORD_DOUBLES_MATCH RPC (experience-weighted)
-- ============================================
create or replace function public.record_doubles_match(
  p_winner1_id uuid,
  p_winner2_id uuid,
  p_loser1_id uuid,
  p_loser2_id uuid,
  p_recorded_by uuid,
  p_challenge_id uuid default null
) returns uuid as $$
declare
  v_w1_elo integer;
  v_w2_elo integer;
  v_l1_elo integer;
  v_l2_elo integer;
  v_w1_total integer;
  v_w2_total integer;
  v_l1_total integer;
  v_l2_total integer;
  v_team_winner_elo integer;
  v_team_loser_elo integer;
  v_expected float;
  v_team_change integer;
  v_player_change integer;
  v_w1_exp float;
  v_w2_exp float;
  v_l1_exp float;
  v_l2_exp float;
  v_w1_change integer;
  v_w2_change integer;
  v_l1_change integer;
  v_l2_change integer;
  v_match_id uuid;
  v_season_id uuid;
begin
  v_season_id := public.get_active_season_id();

  -- Lock and get current ratings + total matches for all 4 players
  select elo_rating, total_wins + total_losses into v_w1_elo, v_w1_total
    from public.profiles where id = p_winner1_id for update;
  select elo_rating, total_wins + total_losses into v_w2_elo, v_w2_total
    from public.profiles where id = p_winner2_id for update;
  select elo_rating, total_wins + total_losses into v_l1_elo, v_l1_total
    from public.profiles where id = p_loser1_id for update;
  select elo_rating, total_wins + total_losses into v_l2_elo, v_l2_total
    from public.profiles where id = p_loser2_id for update;

  -- Team Elo
  v_team_winner_elo := v_w1_elo + v_w2_elo;
  v_team_loser_elo := v_l1_elo + v_l2_elo;

  v_expected := 1.0 / (1.0 + power(10.0, (v_team_loser_elo - v_team_winner_elo)::float / 400.0));
  v_team_change := greatest(1, round(32 * (1.0 - v_expected)));
  v_player_change := greatest(1, round(v_team_change::float / 2.0));

  -- Per-player experience multipliers
  v_w1_exp := public.calc_exp_multiplier(v_w1_total);
  v_w2_exp := public.calc_exp_multiplier(v_w2_total);
  v_l1_exp := public.calc_exp_multiplier(v_l1_total);
  v_l2_exp := public.calc_exp_multiplier(v_l2_total);
  v_w1_change := greatest(1, round(v_player_change * v_w1_exp));
  v_w2_change := greatest(1, round(v_player_change * v_w2_exp));
  v_l1_change := greatest(1, round(v_player_change * v_l1_exp));
  v_l2_change := greatest(1, round(v_player_change * v_l2_exp));

  -- Insert match record (elo_change = winner1's gain for backward compat)
  insert into public.matches (
    winner_id, loser_id, winner_elo_before, loser_elo_before,
    elo_change, loser_elo_change, recorded_by, challenge_id,
    season_id, match_type, status
  )
  values (
    p_winner1_id, p_loser1_id, v_w1_elo, v_l1_elo,
    v_w1_change, v_l1_change, p_recorded_by, p_challenge_id,
    v_season_id, 'doubles', 'confirmed'
  )
  returning id into v_match_id;

  -- Insert match_players with per-player experience-scaled changes
  insert into public.match_players (match_id, player_id, team, elo_before, elo_change) values
    (v_match_id, p_winner1_id, 'winner', v_w1_elo, v_w1_change),
    (v_match_id, p_winner2_id, 'winner', v_w2_elo, v_w2_change),
    (v_match_id, p_loser1_id,  'loser',  v_l1_elo, -v_l1_change),
    (v_match_id, p_loser2_id,  'loser',  v_l2_elo, -v_l2_change);

  -- Update each player individually (different changes)
  update public.profiles
  set elo_rating = elo_rating + v_w1_change, wins = wins + 1,
      total_wins = total_wins + 1, updated_at = now()
  where id = p_winner1_id;

  update public.profiles
  set elo_rating = elo_rating + v_w2_change, wins = wins + 1,
      total_wins = total_wins + 1, updated_at = now()
  where id = p_winner2_id;

  update public.profiles
  set elo_rating = greatest(100, elo_rating - v_l1_change), losses = losses + 1,
      total_losses = total_losses + 1, updated_at = now()
  where id = p_loser1_id;

  update public.profiles
  set elo_rating = greatest(100, elo_rating - v_l2_change), losses = losses + 1,
      total_losses = total_losses + 1, updated_at = now()
  where id = p_loser2_id;

  -- Complete challenge if applicable
  if p_challenge_id is not null then
    update public.challenges
    set status = 'completed', completed_at = now()
    where id = p_challenge_id;
  end if;

  return v_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- REPLACE CREATE_PENDING_DOUBLES_MATCH RPC (experience-weighted)
-- ============================================
create or replace function public.create_pending_doubles_match(
  p_winner1_id uuid,
  p_winner2_id uuid,
  p_loser1_id uuid,
  p_loser2_id uuid,
  p_recorded_by uuid,
  p_challenge_id uuid default null
) returns uuid as $$
declare
  v_w1_elo integer;
  v_w2_elo integer;
  v_l1_elo integer;
  v_l2_elo integer;
  v_w1_total integer;
  v_w2_total integer;
  v_l1_total integer;
  v_l2_total integer;
  v_team_winner_elo integer;
  v_team_loser_elo integer;
  v_expected float;
  v_team_change integer;
  v_player_change integer;
  v_w1_exp float;
  v_w2_exp float;
  v_l1_exp float;
  v_l2_exp float;
  v_w1_change integer;
  v_w2_change integer;
  v_l1_change integer;
  v_l2_change integer;
  v_match_id uuid;
  v_season_id uuid;
begin
  v_season_id := public.get_active_season_id();

  -- Read current ratings + total matches (no lock, preview only)
  select elo_rating, total_wins + total_losses into v_w1_elo, v_w1_total
    from public.profiles where id = p_winner1_id;
  select elo_rating, total_wins + total_losses into v_w2_elo, v_w2_total
    from public.profiles where id = p_winner2_id;
  select elo_rating, total_wins + total_losses into v_l1_elo, v_l1_total
    from public.profiles where id = p_loser1_id;
  select elo_rating, total_wins + total_losses into v_l2_elo, v_l2_total
    from public.profiles where id = p_loser2_id;

  v_team_winner_elo := v_w1_elo + v_w2_elo;
  v_team_loser_elo := v_l1_elo + v_l2_elo;

  v_expected := 1.0 / (1.0 + power(10.0, (v_team_loser_elo - v_team_winner_elo)::float / 400.0));
  v_team_change := greatest(1, round(32 * (1.0 - v_expected)));
  v_player_change := greatest(1, round(v_team_change::float / 2.0));

  -- Per-player experience multipliers
  v_w1_exp := public.calc_exp_multiplier(v_w1_total);
  v_w2_exp := public.calc_exp_multiplier(v_w2_total);
  v_l1_exp := public.calc_exp_multiplier(v_l1_total);
  v_l2_exp := public.calc_exp_multiplier(v_l2_total);
  v_w1_change := greatest(1, round(v_player_change * v_w1_exp));
  v_w2_change := greatest(1, round(v_player_change * v_w2_exp));
  v_l1_change := greatest(1, round(v_player_change * v_l1_exp));
  v_l2_change := greatest(1, round(v_player_change * v_l2_exp));

  -- Insert match record with pending status
  insert into public.matches (
    winner_id, loser_id, winner_elo_before, loser_elo_before,
    elo_change, loser_elo_change, recorded_by, challenge_id,
    status, season_id, match_type
  )
  values (
    p_winner1_id, p_loser1_id, v_w1_elo, v_l1_elo,
    v_w1_change, v_l1_change, p_recorded_by, p_challenge_id,
    'pending', v_season_id, 'doubles'
  )
  returning id into v_match_id;

  -- Insert match_players with per-player experience-scaled preview values
  insert into public.match_players (match_id, player_id, team, elo_before, elo_change) values
    (v_match_id, p_winner1_id, 'winner', v_w1_elo, v_w1_change),
    (v_match_id, p_winner2_id, 'winner', v_w2_elo, v_w2_change),
    (v_match_id, p_loser1_id,  'loser',  v_l1_elo, -v_l1_change),
    (v_match_id, p_loser2_id,  'loser',  v_l2_elo, -v_l2_change);

  return v_match_id;
end;
$$ language plpgsql security definer;
