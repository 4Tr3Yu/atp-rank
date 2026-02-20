-- ATP Rank: Seasons System
-- Adds monthly seasons with Elo resets, medal awards for top 3 + MVP,
-- and all-time stats tracking.
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

-- ============================================
-- ENUMS
-- ============================================
create type public.season_status as enum ('upcoming', 'active', 'completed');
create type public.medal_type as enum ('gold', 'silver', 'bronze', 'mvp');

-- ============================================
-- SEASONS TABLE
-- ============================================
create table public.seasons (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  description   text,
  status        public.season_status not null default 'upcoming',
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  created_at    timestamptz not null default now(),
  created_by    uuid references public.profiles(id) on delete set null,

  constraint valid_date_range check (ends_at > starts_at)
);

alter table public.seasons enable row level security;

create policy "Seasons are viewable by everyone"
  on public.seasons for select using (true);

create policy "Creator can update season"
  on public.seasons for update using (auth.uid() = created_by);

create policy "Authenticated users can create seasons"
  on public.seasons for insert with check (auth.uid() = created_by);

-- ============================================
-- SEASON WINNERS TABLE
-- ============================================
create table public.season_winners (
  id              uuid primary key default gen_random_uuid(),
  season_id       uuid not null references public.seasons(id) on delete cascade,
  player_id       uuid not null references public.profiles(id) on delete cascade,
  medal_type      public.medal_type not null,
  final_elo       integer not null,
  season_wins     integer not null,
  season_losses   integer not null,
  final_rank      integer not null,
  awarded_at      timestamptz not null default now(),

  unique(season_id, medal_type, player_id)
);

alter table public.season_winners enable row level security;

create policy "Season winners are viewable by everyone"
  on public.season_winners for select using (true);

-- ============================================
-- PROFILES: ADD ALL-TIME STATS
-- ============================================
alter table public.profiles
  add column total_wins integer not null default 0,
  add column total_losses integer not null default 0;

-- Backfill existing data: copy current wins/losses to total
update public.profiles
set total_wins = wins, total_losses = losses;

-- ============================================
-- MATCHES: ADD SEASON REFERENCE
-- ============================================
alter table public.matches
  add column season_id uuid references public.seasons(id) on delete set null;

-- ============================================
-- HELPER: GET ACTIVE SEASON
-- ============================================
create or replace function public.get_active_season_id()
returns uuid as $$
  select id from public.seasons where status = 'active' limit 1;
$$ language sql stable security definer;

-- ============================================
-- UPDATE RECORD_MATCH RPC (add season_id)
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
  v_change integer;
  v_match_id uuid;
  v_season_id uuid;
begin
  -- Get active season
  v_season_id := public.get_active_season_id();

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

  -- Insert match record with season_id
  insert into public.matches (winner_id, loser_id, winner_elo_before, loser_elo_before, elo_change, recorded_by, challenge_id, tournament_match_id, season_id)
  values (p_winner_id, p_loser_id, v_winner_elo, v_loser_elo, v_change, p_recorded_by, p_challenge_id, p_tournament_match_id, v_season_id)
  returning id into v_match_id;

  -- Update winner (season + total)
  update public.profiles
  set elo_rating = elo_rating + v_change,
      wins = wins + 1,
      total_wins = total_wins + 1,
      updated_at = now()
  where id = p_winner_id;

  -- Update loser (floor at 100, season + total)
  update public.profiles
  set elo_rating = greatest(100, elo_rating - v_change),
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
-- UPDATE CREATE_PENDING_MATCH RPC (add season_id)
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
  v_change integer;
  v_match_id uuid;
  v_season_id uuid;
begin
  -- Get active season
  v_season_id := public.get_active_season_id();

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

  -- Insert match record with pending status and season_id
  insert into public.matches (
    winner_id, loser_id, winner_elo_before, loser_elo_before,
    elo_change, recorded_by, challenge_id, status, season_id
  )
  values (
    p_winner_id, p_loser_id, v_winner_elo, v_loser_elo,
    v_change, p_recorded_by, p_challenge_id, 'pending', v_season_id
  )
  returning id into v_match_id;

  return v_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- UPDATE CONFIRM_MATCH RPC (handle total stats)
-- ============================================
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
-- START SEASON RPC
-- ============================================
create or replace function public.start_season(p_season_id uuid)
returns void as $$
begin
  -- Mark any currently active season as completed first
  update public.seasons
  set status = 'completed'
  where status = 'active';

  -- Mark the new season as active
  update public.seasons
  set status = 'active'
  where id = p_season_id and status = 'upcoming';

  if not found then
    raise exception 'Season not found or not in upcoming status';
  end if;
end;
$$ language plpgsql security definer;

-- ============================================
-- END SEASON RPC
-- ============================================
-- Awards medals to top 3 by Elo + MVP (most wins)
-- Resets all player Elo to 1200 and season wins/losses to 0
-- Clears matches table
create or replace function public.end_season(p_season_id uuid)
returns void as $$
declare
  v_season record;
  v_player record;
  v_rank integer;
  v_mvp_player_id uuid;
  v_mvp_wins integer;
  v_mvp_elo integer;
  v_mvp_losses integer;
  v_mvp_rank integer;
begin
  -- Get and validate season
  select * into v_season from public.seasons where id = p_season_id for update;

  if v_season is null then
    raise exception 'Season not found';
  end if;

  if v_season.status != 'active' then
    raise exception 'Season is not active';
  end if;

  -- Award medals to top 3 by Elo
  v_rank := 0;
  for v_player in
    select id, elo_rating, wins, losses
    from public.profiles
    order by elo_rating desc
    limit 3
  loop
    v_rank := v_rank + 1;
    insert into public.season_winners
      (season_id, player_id, medal_type, final_elo, season_wins, season_losses, final_rank)
    values (
      p_season_id,
      v_player.id,
      case v_rank
        when 1 then 'gold'::public.medal_type
        when 2 then 'silver'::public.medal_type
        when 3 then 'bronze'::public.medal_type
      end,
      v_player.elo_rating,
      v_player.wins,
      v_player.losses,
      v_rank
    );
  end loop;

  -- Award MVP to player with most wins (if they played at least 1 game)
  select id, wins, elo_rating, losses into v_mvp_player_id, v_mvp_wins, v_mvp_elo, v_mvp_losses
  from public.profiles
  where wins > 0
  order by wins desc, elo_rating desc
  limit 1;

  if v_mvp_player_id is not null then
    -- Get MVP's actual rank
    select count(*) + 1 into v_mvp_rank
    from public.profiles
    where elo_rating > v_mvp_elo;

    -- Insert MVP medal (player can have both podium medal + MVP)
    insert into public.season_winners
      (season_id, player_id, medal_type, final_elo, season_wins, season_losses, final_rank)
    values (
      p_season_id,
      v_mvp_player_id,
      'mvp'::public.medal_type,
      v_mvp_elo,
      v_mvp_wins,
      v_mvp_losses,
      v_mvp_rank
    );
  end if;

  -- Clear matches table (we don't archive individual matches)
  delete from public.matches;

  -- Reset all player season stats (Elo to 1200, wins/losses to 0)
  -- Note: total_wins/total_losses are NOT reset
  update public.profiles
  set
    elo_rating = 1200,
    wins = 0,
    losses = 0,
    updated_at = now();

  -- Mark season as completed
  update public.seasons
  set status = 'completed'
  where id = p_season_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- INDEXES
-- ============================================
create index idx_seasons_status on public.seasons(status);
create index idx_seasons_dates on public.seasons(starts_at, ends_at);
create index idx_season_winners_season on public.season_winners(season_id);
create index idx_season_winners_player on public.season_winners(player_id);
create index idx_matches_season on public.matches(season_id);
