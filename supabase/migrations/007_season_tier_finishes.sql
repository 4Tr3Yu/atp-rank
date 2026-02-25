-- ATP Rank: Season Tier Finishes
-- Records every player's final Elo when a season ends, so we can
-- display tier-colored avatar rings and tier history on profiles.
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

-- ============================================
-- SEASON TIER FINISHES TABLE
-- ============================================

create table public.season_tier_finishes (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid not null references public.seasons(id) on delete cascade,
  player_id   uuid not null references public.profiles(id) on delete cascade,
  final_elo   integer not null,
  awarded_at  timestamptz not null default now(),

  unique(season_id, player_id)
);

alter table public.season_tier_finishes enable row level security;

create policy "Season tier finishes are viewable by everyone"
  on public.season_tier_finishes for select using (true);

create index idx_season_tier_finishes_season on public.season_tier_finishes(season_id);
create index idx_season_tier_finishes_player on public.season_tier_finishes(player_id);

-- ============================================
-- UPDATE END_SEASON RPC
-- ============================================
-- Adds tier finish recording before the Elo reset.

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

  -- Record tier finishes for ALL players before resetting Elo
  insert into public.season_tier_finishes (season_id, player_id, final_elo)
  select p_season_id, id, elo_rating from public.profiles;

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
