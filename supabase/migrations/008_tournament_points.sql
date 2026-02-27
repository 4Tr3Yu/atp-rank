-- ATP Rank: Tournament Points (Elo Bonus on Completion)
-- Awards Elo bonus based on tournament placement when a tournament completes.
-- First-round losers get nothing. Deeper runs earn more Elo.
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

-- ============================================
-- TOURNAMENT RESULTS TABLE
-- ============================================
-- Stores each player's placement per tournament for display purposes.

create table public.tournament_results (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references public.tournaments(id) on delete cascade,
  player_id       uuid not null references public.profiles(id) on delete cascade,
  position_label  text not null,       -- 'Champion', 'Runner-up', 'Semifinalist', etc.
  elo_bonus       integer not null,    -- Elo points awarded (added to elo_rating)
  awarded_at      timestamptz not null default now(),

  unique(tournament_id, player_id)
);

alter table public.tournament_results enable row level security;

create policy "Tournament results are viewable by everyone"
  on public.tournament_results for select using (true);

create index idx_tournament_results_tournament on public.tournament_results(tournament_id);
create index idx_tournament_results_player on public.tournament_results(player_id);

-- ============================================
-- AWARD TOURNAMENT POINTS RPC
-- ============================================
-- Called when a tournament completes. Determines each player's placement,
-- inserts tournament_results rows, and adds Elo bonus to profiles.

create or replace function public.award_tournament_points(p_tournament_id uuid)
returns void as $$
declare
  v_tournament record;
  v_participant record;
  v_total_rounds integer;
  v_final_round integer;
  v_is_champion boolean;
  v_elo_bonus integer;
  v_position_label text;
begin
  -- Validate tournament is completed
  select * into v_tournament from public.tournaments
  where id = p_tournament_id and status = 'completed';

  if v_tournament is null then
    raise exception 'Tournament not found or not completed';
  end if;

  -- Get total rounds in bracket
  select max(round) into v_total_rounds
  from public.tournament_matches
  where tournament_id = p_tournament_id;

  -- Process each participant
  for v_participant in
    select tp.player_id
    from public.tournament_participants tp
    where tp.tournament_id = p_tournament_id
  loop
    -- Check if this player is the champion (won the final)
    select exists(
      select 1 from public.tournament_matches
      where tournament_id = p_tournament_id
        and round = v_total_rounds
        and winner_id = v_participant.player_id
    ) into v_is_champion;

    if v_is_champion then
      v_position_label := 'Champion';
      v_elo_bonus := 100;
    else
      -- Find the round where this player lost
      select tm.round into v_final_round
      from public.tournament_matches tm
      where tm.tournament_id = p_tournament_id
        and tm.winner_id is not null
        and (tm.player1_id = v_participant.player_id or tm.player2_id = v_participant.player_id)
        and tm.winner_id != v_participant.player_id
      order by tm.round desc
      limit 1;

      -- Handle edge case (player only had byes, never played)
      if v_final_round is null then
        v_final_round := 1;
      end if;

      -- Assign bonus and label based on which round they lost in
      if v_final_round = v_total_rounds then
        -- Lost in final = runner-up
        v_position_label := 'Runner-up';
        v_elo_bonus := 60;
      elsif v_final_round = v_total_rounds - 1 then
        -- Lost in semis
        v_position_label := 'Semifinalist';
        v_elo_bonus := 25;
      elsif v_final_round = v_total_rounds - 2 then
        -- Lost in quarters
        v_position_label := 'Quarterfinalist';
        v_elo_bonus := 10;
      else
        -- Lost in round 1 or earlier rounds
        v_position_label := 'Round ' || v_final_round;
        v_elo_bonus := 0;
      end if;
    end if;

    -- Insert tournament result
    insert into public.tournament_results
      (tournament_id, player_id, position_label, elo_bonus)
    values
      (p_tournament_id, v_participant.player_id, v_position_label, v_elo_bonus);

    -- Add Elo bonus to player profile
    if v_elo_bonus > 0 then
      update public.profiles
      set elo_rating = elo_rating + v_elo_bonus,
          updated_at = now()
      where id = v_participant.player_id;
    end if;
  end loop;
end;
$$ language plpgsql security definer;
