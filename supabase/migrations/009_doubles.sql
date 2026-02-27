-- ATP Rank: Doubles Matches & Challenges
-- Adds 2v2 (doubles) support alongside existing 1v1 (singles).
-- Team Elo = sum of individual Elos. Change split by 2 per player.
-- Flat K=32 for doubles (no rank-weighting).
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

-- ============================================
-- MATCH TYPE ENUM
-- ============================================
create type public.match_type as enum ('singles', 'doubles');

-- ============================================
-- ALTER MATCHES TABLE
-- ============================================
alter table public.matches
  add column match_type public.match_type not null default 'singles';

-- ============================================
-- MATCH PLAYERS TABLE (for doubles)
-- ============================================
-- Stores per-player data for doubles matches (4 rows per match).
-- Not used for singles — those use the existing winner_id/loser_id columns.
create table public.match_players (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  player_id  uuid not null references public.profiles(id) on delete cascade,
  team       text not null check (team in ('winner', 'loser')),
  elo_before integer not null,
  elo_change integer not null,

  unique(match_id, player_id)
);

alter table public.match_players enable row level security;

create policy "Match players are viewable by everyone"
  on public.match_players for select using (true);

create policy "Authenticated users can insert match players"
  on public.match_players for insert
  with check (auth.uid() is not null);

create index idx_match_players_match on public.match_players(match_id);
create index idx_match_players_player on public.match_players(player_id);

-- ============================================
-- ALTER CHALLENGES TABLE
-- ============================================
alter table public.challenges
  add column match_type public.match_type not null default 'singles',
  add column challenger_partner_id uuid references public.profiles(id) on delete set null,
  add column challenged_partner_id uuid references public.profiles(id) on delete set null;

-- Ensure all 4 players are different in doubles challenges
alter table public.challenges
  add constraint doubles_different_players
  check (
    match_type = 'singles'
    or (
      challenger_partner_id is not null
      and challenged_partner_id is not null
      and challenger_id != challenger_partner_id
      and challenged_id != challenged_partner_id
      and challenger_id != challenged_partner_id
      and challenged_id != challenger_partner_id
      and challenger_partner_id != challenged_partner_id
    )
  );

-- ============================================
-- RLS: UPDATE CHALLENGE POLICIES FOR PARTNERS
-- ============================================

-- Drop old policies that only check challenger_id/challenged_id
drop policy if exists "Users can view own challenges" on public.challenges;
drop policy if exists "Involved users can update challenges" on public.challenges;

-- Recreate with partner support
create policy "Users can view own challenges"
  on public.challenges for select
  using (
    auth.uid() in (challenger_id, challenged_id, challenger_partner_id, challenged_partner_id)
  );

create policy "Involved users can update challenges"
  on public.challenges for update
  using (
    auth.uid() in (challenger_id, challenged_id, challenger_partner_id, challenged_partner_id)
  );

-- Note: The public viewing policy ("Anyone can view pending and accepted challenges")
-- from migration 006 still works — it checks status, not player IDs.
-- The create policy still only checks auth.uid() = challenger_id, which is correct.

-- ============================================
-- RPC: RECORD DOUBLES MATCH (immediate Elo)
-- ============================================
-- For challenge resolutions and tournament matches.
-- Team Elo = sum of pair. Flat K=32. Change split by 2.
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
  v_team_winner_elo integer;
  v_team_loser_elo integer;
  v_expected float;
  v_team_change integer;
  v_player_change integer;
  v_match_id uuid;
  v_season_id uuid;
begin
  -- Get active season
  v_season_id := public.get_active_season_id();

  -- Lock and get current ratings for all 4 players
  select elo_rating into v_w1_elo from public.profiles where id = p_winner1_id for update;
  select elo_rating into v_w2_elo from public.profiles where id = p_winner2_id for update;
  select elo_rating into v_l1_elo from public.profiles where id = p_loser1_id for update;
  select elo_rating into v_l2_elo from public.profiles where id = p_loser2_id for update;

  -- Team Elo = sum of individual Elos
  v_team_winner_elo := v_w1_elo + v_w2_elo;
  v_team_loser_elo := v_l1_elo + v_l2_elo;

  -- Expected score using team Elo sums
  v_expected := 1.0 / (1.0 + power(10.0, (v_team_loser_elo - v_team_winner_elo)::float / 400.0));

  -- Team-level Elo change (flat K=32, no rank-weighting for doubles)
  v_team_change := greatest(1, round(32 * (1.0 - v_expected)));

  -- Each player gets half the change
  v_player_change := greatest(1, round(v_team_change::float / 2.0));

  -- Insert match record (winner_id/loser_id store first player of each team)
  insert into public.matches (
    winner_id, loser_id, winner_elo_before, loser_elo_before,
    elo_change, recorded_by, challenge_id, season_id, match_type, status
  )
  values (
    p_winner1_id, p_loser1_id, v_w1_elo, v_l1_elo,
    v_player_change, p_recorded_by, p_challenge_id, v_season_id, 'doubles', 'confirmed'
  )
  returning id into v_match_id;

  -- Insert match_players rows for all 4 players
  insert into public.match_players (match_id, player_id, team, elo_before, elo_change) values
    (v_match_id, p_winner1_id, 'winner', v_w1_elo, v_player_change),
    (v_match_id, p_winner2_id, 'winner', v_w2_elo, v_player_change),
    (v_match_id, p_loser1_id, 'loser', v_l1_elo, -v_player_change),
    (v_match_id, p_loser2_id, 'loser', v_l2_elo, -v_player_change);

  -- Update winners (season + total)
  update public.profiles
  set elo_rating = elo_rating + v_player_change,
      wins = wins + 1,
      total_wins = total_wins + 1,
      updated_at = now()
  where id in (p_winner1_id, p_winner2_id);

  -- Update losers (floor at 100, season + total)
  update public.profiles
  set elo_rating = greatest(100, elo_rating - v_player_change),
      losses = losses + 1,
      total_losses = total_losses + 1,
      updated_at = now()
  where id in (p_loser1_id, p_loser2_id);

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
-- RPC: CREATE PENDING DOUBLES MATCH
-- ============================================
-- Creates a doubles match with status='pending', no Elo changes yet.
-- Elo preview is stored; real calculation at confirm time.
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
  v_team_winner_elo integer;
  v_team_loser_elo integer;
  v_expected float;
  v_team_change integer;
  v_player_change integer;
  v_match_id uuid;
  v_season_id uuid;
begin
  v_season_id := public.get_active_season_id();

  -- Read current ratings (no lock, preview only)
  select elo_rating into v_w1_elo from public.profiles where id = p_winner1_id;
  select elo_rating into v_w2_elo from public.profiles where id = p_winner2_id;
  select elo_rating into v_l1_elo from public.profiles where id = p_loser1_id;
  select elo_rating into v_l2_elo from public.profiles where id = p_loser2_id;

  v_team_winner_elo := v_w1_elo + v_w2_elo;
  v_team_loser_elo := v_l1_elo + v_l2_elo;

  v_expected := 1.0 / (1.0 + power(10.0, (v_team_loser_elo - v_team_winner_elo)::float / 400.0));
  v_team_change := greatest(1, round(32 * (1.0 - v_expected)));
  v_player_change := greatest(1, round(v_team_change::float / 2.0));

  -- Insert match record with pending status
  insert into public.matches (
    winner_id, loser_id, winner_elo_before, loser_elo_before,
    elo_change, recorded_by, challenge_id, status, season_id, match_type
  )
  values (
    p_winner1_id, p_loser1_id, v_w1_elo, v_l1_elo,
    v_player_change, p_recorded_by, p_challenge_id, 'pending', v_season_id, 'doubles'
  )
  returning id into v_match_id;

  -- Insert match_players with preview values
  insert into public.match_players (match_id, player_id, team, elo_before, elo_change) values
    (v_match_id, p_winner1_id, 'winner', v_w1_elo, v_player_change),
    (v_match_id, p_winner2_id, 'winner', v_w2_elo, v_player_change),
    (v_match_id, p_loser1_id, 'loser', v_l1_elo, -v_player_change),
    (v_match_id, p_loser2_id, 'loser', v_l2_elo, -v_player_change);

  return v_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- UPDATE CONFIRM_MATCH RPC (handle doubles)
-- ============================================
-- Branches on match_type. For doubles, locks all 4 players,
-- recalculates team Elo, applies half-change each.
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
  v_change integer;
  -- doubles vars
  v_team_winner_elo integer;
  v_team_loser_elo integer;
  v_team_change integer;
  v_player_change integer;
  v_is_participant boolean;
  v_w1_id uuid;
  v_w2_id uuid;
  v_l1_id uuid;
  v_l2_id uuid;
  v_w1_elo integer;
  v_w2_elo integer;
  v_l1_elo integer;
  v_l2_elo integer;
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

    -- Check confirmer is one of the 4 participants
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

    -- Lock and get current Elo for all 4 players
    select elo_rating into v_w1_elo from public.profiles where id = v_w1_id for update;
    select elo_rating into v_w2_elo from public.profiles where id = v_w2_id for update;
    select elo_rating into v_l1_elo from public.profiles where id = v_l1_id for update;
    select elo_rating into v_l2_elo from public.profiles where id = v_l2_id for update;

    -- Recalculate with current team Elos
    v_team_winner_elo := v_w1_elo + v_w2_elo;
    v_team_loser_elo := v_l1_elo + v_l2_elo;

    v_expected := 1.0 / (1.0 + power(10.0, (v_team_loser_elo - v_team_winner_elo)::float / 400.0));
    v_team_change := greatest(1, round(32 * (1.0 - v_expected)));
    v_player_change := greatest(1, round(v_team_change::float / 2.0));

    -- Update match record with recalculated values
    update public.matches
    set status = 'confirmed',
        confirmed_at = now(),
        winner_elo_before = v_w1_elo,
        loser_elo_before = v_l1_elo,
        elo_change = v_player_change
    where id = p_match_id;

    -- Update match_players with recalculated values
    update public.match_players
    set elo_before = case player_id
          when v_w1_id then v_w1_elo
          when v_w2_id then v_w2_elo
          when v_l1_id then v_l1_elo
          when v_l2_id then v_l2_elo
        end,
        elo_change = case team
          when 'winner' then v_player_change
          else -v_player_change
        end
    where match_id = p_match_id;

    -- Apply Elo to all 4 players (season + total)
    update public.profiles
    set elo_rating = elo_rating + v_player_change,
        wins = wins + 1,
        total_wins = total_wins + 1,
        updated_at = now()
    where id in (v_w1_id, v_w2_id);

    update public.profiles
    set elo_rating = greatest(100, elo_rating - v_player_change),
        losses = losses + 1,
        total_losses = total_losses + 1,
        updated_at = now()
    where id in (v_l1_id, v_l2_id);

  else
    -- ========== SINGLES CONFIRMATION (unchanged) ==========

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

    -- Apply Elo changes (season + total)
    update public.profiles
    set elo_rating = elo_rating + v_change,
        wins = wins + 1,
        total_wins = total_wins + 1,
        updated_at = now()
    where id = v_match.winner_id;

    update public.profiles
    set elo_rating = greatest(100, elo_rating - v_change),
        losses = losses + 1,
        total_losses = total_losses + 1,
        updated_at = now()
    where id = v_match.loser_id;
  end if;

  -- Complete challenge if applicable (both singles and doubles)
  if v_match.challenge_id is not null then
    update public.challenges
    set status = 'completed', completed_at = now()
    where id = v_match.challenge_id;
  end if;

  return p_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- UPDATE DECLINE_MATCH RPC (handle doubles)
-- ============================================
create or replace function public.decline_match(
  p_match_id uuid,
  p_decliner_id uuid
) returns uuid as $$
declare
  v_match record;
  v_is_participant boolean;
begin
  select * into v_match
  from public.matches
  where id = p_match_id;

  if v_match is null then
    raise exception 'Match not found';
  end if;

  if v_match.status != 'pending' then
    raise exception 'Match is not pending';
  end if;

  if v_match.match_type = 'doubles' then
    -- For doubles: check match_players table
    select exists(
      select 1 from public.match_players
      where match_id = p_match_id and player_id = p_decliner_id
    ) into v_is_participant;

    if not v_is_participant then
      raise exception 'Only match participants can decline';
    end if;
  else
    -- For singles: existing check
    if p_decliner_id != v_match.winner_id and p_decliner_id != v_match.loser_id then
      raise exception 'Only match participants can decline';
    end if;
  end if;

  if p_decliner_id = v_match.recorded_by then
    raise exception 'The person who recorded the match cannot decline it';
  end if;

  update public.matches
  set status = 'declined'
  where id = p_match_id;

  return p_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- RPC: RESOLVE DOUBLES CHALLENGE
-- ============================================
-- Reporter says "I Won" or "I Lost" → determines teams from challenge,
-- delegates to record_doubles_match for atomic Elo update.
create or replace function public.resolve_doubles_challenge(
  p_challenge_id uuid,
  p_reporter_id uuid,
  p_reporter_won boolean
) returns uuid as $$
declare
  v_challenge record;
  v_match_id uuid;
  v_winner1_id uuid;
  v_winner2_id uuid;
  v_loser1_id uuid;
  v_loser2_id uuid;
begin
  -- Lock and fetch challenge
  select * into v_challenge
  from public.challenges
  where id = p_challenge_id
  for update;

  if v_challenge is null then
    raise exception 'Challenge not found';
  end if;

  if v_challenge.status != 'accepted' then
    raise exception 'Challenge is not in accepted status';
  end if;

  if v_challenge.match_type != 'doubles' then
    raise exception 'This is not a doubles challenge';
  end if;

  -- Validate reporter is one of the 4 participants
  if p_reporter_id not in (
    v_challenge.challenger_id, v_challenge.challenger_partner_id,
    v_challenge.challenged_id, v_challenge.challenged_partner_id
  ) then
    raise exception 'Only challenge participants can report results';
  end if;

  -- Determine winning/losing teams based on reporter's team and claim
  if p_reporter_id in (v_challenge.challenger_id, v_challenge.challenger_partner_id) then
    -- Reporter is on challenger's team
    if p_reporter_won then
      v_winner1_id := v_challenge.challenger_id;
      v_winner2_id := v_challenge.challenger_partner_id;
      v_loser1_id := v_challenge.challenged_id;
      v_loser2_id := v_challenge.challenged_partner_id;
    else
      v_winner1_id := v_challenge.challenged_id;
      v_winner2_id := v_challenge.challenged_partner_id;
      v_loser1_id := v_challenge.challenger_id;
      v_loser2_id := v_challenge.challenger_partner_id;
    end if;
  else
    -- Reporter is on challenged's team
    if p_reporter_won then
      v_winner1_id := v_challenge.challenged_id;
      v_winner2_id := v_challenge.challenged_partner_id;
      v_loser1_id := v_challenge.challenger_id;
      v_loser2_id := v_challenge.challenger_partner_id;
    else
      v_winner1_id := v_challenge.challenger_id;
      v_winner2_id := v_challenge.challenger_partner_id;
      v_loser1_id := v_challenge.challenged_id;
      v_loser2_id := v_challenge.challenged_partner_id;
    end if;
  end if;

  v_match_id := public.record_doubles_match(
    p_winner1_id := v_winner1_id,
    p_winner2_id := v_winner2_id,
    p_loser1_id := v_loser1_id,
    p_loser2_id := v_loser2_id,
    p_recorded_by := p_reporter_id,
    p_challenge_id := p_challenge_id
  );

  return v_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- UPDATE RESOLVE_EXPIRED_CHALLENGES (handle doubles)
-- ============================================
-- Forfeit: challenger's team wins expired accepted challenges.
create or replace function public.resolve_expired_challenges()
returns integer as $$
declare
  v_challenge record;
  v_count integer := 0;
begin
  for v_challenge in
    select *
    from public.challenges
    where status = 'accepted'
      and expires_at < now()
    for update
  loop
    if v_challenge.match_type = 'doubles' then
      -- Doubles: challenger's team wins by forfeit
      perform public.record_doubles_match(
        p_winner1_id := v_challenge.challenger_id,
        p_winner2_id := v_challenge.challenger_partner_id,
        p_loser1_id := v_challenge.challenged_id,
        p_loser2_id := v_challenge.challenged_partner_id,
        p_recorded_by := v_challenge.challenger_id,
        p_challenge_id := v_challenge.id
      );
    else
      -- Singles: challenger wins by forfeit (existing behavior)
      perform public.record_match(
        p_winner_id := v_challenge.challenger_id,
        p_loser_id := v_challenge.challenged_id,
        p_recorded_by := v_challenge.challenger_id,
        p_challenge_id := v_challenge.id
      );
    end if;

    -- Override status to 'expired' (record_match/record_doubles_match sets it to 'completed')
    update public.challenges
    set status = 'expired'
    where id = v_challenge.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$ language plpgsql security definer;
