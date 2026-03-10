-- ATP Rank: Fix doubles tournament rewards — award points to both team members
-- Previously only player_id got rewards, partner_id was ignored.
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
  v_is_doubles boolean;
  v_player_ids uuid[];
  v_pid uuid;
begin
  -- Validate tournament is completed
  select * into v_tournament from public.tournaments
  where id = p_tournament_id and status = 'completed';

  if v_tournament is null then
    raise exception 'Tournament not found or not completed';
  end if;

  v_is_doubles := v_tournament.match_type = 'doubles';

  -- Get total rounds in bracket
  select max(round) into v_total_rounds
  from public.tournament_matches
  where tournament_id = p_tournament_id;

  -- Scale multiplier: 2 rounds = 1x, 3 rounds = 1.5x, 4 rounds = 2x
  v_multiplier := v_total_rounds / 2.0;

  -- Process each participant row (one per team in doubles, one per player in singles)
  for v_participant in
    select tp.player_id, tp.partner_id
    from public.tournament_participants tp
    where tp.tournament_id = p_tournament_id
  loop
    -- Check if this player/team is the champion (won the final)
    -- In doubles, winner_id is the team lead (player_id), so check that
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
      -- Find the round where this player/team lost
      -- Check both player slots and partner slots for doubles
      select tm.round into v_final_round
      from public.tournament_matches tm
      where tm.tournament_id = p_tournament_id
        and tm.winner_id is not null
        and (
          tm.player1_id = v_participant.player_id
          or tm.player2_id = v_participant.player_id
          or (v_is_doubles and tm.player1_partner_id = v_participant.player_id)
          or (v_is_doubles and tm.player2_partner_id = v_participant.player_id)
        )
        and tm.winner_id != v_participant.player_id
      order by tm.round desc
      limit 1;

      -- Handle edge case (player only had byes, never played)
      if v_final_round is null then
        v_final_round := 1;
      end if;

      -- Assign base bonus and label based on which round they lost in
      if v_final_round = v_total_rounds then
        v_position_label := 'Runner-up';
        v_base_bonus := 160;
      elsif v_final_round = v_total_rounds - 1 then
        v_position_label := 'Semifinalist';
        v_base_bonus := 125;
      elsif v_final_round = v_total_rounds - 2 then
        v_position_label := 'Quarterfinalist';
        v_base_bonus := 110;
      else
        v_position_label := 'Round ' || v_final_round;
        v_base_bonus := 0;
      end if;
    end if;

    -- Apply scale multiplier and round to nearest 5
    v_elo_bonus := round(v_base_bonus * v_multiplier / 5.0) * 5;

    -- Build list of player IDs to reward (both teammates in doubles)
    v_player_ids := array[v_participant.player_id];
    if v_is_doubles and v_participant.partner_id is not null then
      v_player_ids := v_player_ids || v_participant.partner_id;
    end if;

    -- Award each player
    foreach v_pid in array v_player_ids
    loop
      insert into public.tournament_results
        (tournament_id, player_id, position_label, elo_bonus)
      values
        (p_tournament_id, v_pid, v_position_label, v_elo_bonus);

      if v_elo_bonus > 0 then
        update public.profiles
        set elo_rating = elo_rating + v_elo_bonus,
            updated_at = now()
        where id = v_pid;
      end if;
    end loop;
  end loop;
end;
$$ language plpgsql security definer;
