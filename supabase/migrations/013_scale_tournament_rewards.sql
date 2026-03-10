-- ATP Rank: Scale tournament rewards by bracket size
-- More players = higher rewards. Multiplier = total_rounds / 2.0
-- 4 players (2 rounds, 1x):  Champion 200, Runner-up 160, Semi 125
-- 8 players (3 rounds, 1.5x): Champion 300, Runner-up 240, Semi 190, QF 165
-- 16 players (4 rounds, 2x):  Champion 400, Runner-up 320, Semi 250, QF 220
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

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
  v_multiplier numeric;
  v_base_bonus integer;
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

  -- Scale multiplier: 2 rounds = 1x, 3 rounds = 1.5x, 4 rounds = 2x
  v_multiplier := v_total_rounds / 2.0;

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
      v_base_bonus := 200;
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

      -- Assign base bonus and label based on which round they lost in
      if v_final_round = v_total_rounds then
        -- Lost in final = runner-up
        v_position_label := 'Runner-up';
        v_base_bonus := 160;
      elsif v_final_round = v_total_rounds - 1 then
        -- Lost in semis
        v_position_label := 'Semifinalist';
        v_base_bonus := 125;
      elsif v_final_round = v_total_rounds - 2 then
        -- Lost in quarters
        v_position_label := 'Quarterfinalist';
        v_base_bonus := 110;
      else
        -- Lost in round 1 or earlier rounds
        v_position_label := 'Round ' || v_final_round;
        v_base_bonus := 0;
      end if;
    end if;

    -- Apply scale multiplier and round to nearest 5
    v_elo_bonus := round(v_base_bonus * v_multiplier / 5.0) * 5;

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
