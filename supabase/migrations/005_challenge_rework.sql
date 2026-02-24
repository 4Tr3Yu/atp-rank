-- ATP Rank: Challenge System Rework
-- Makes challenges the primary way to play: public when active, 48h timer,
-- self-resolving with "I Won / I Lost", forfeit on expiry.
--
-- Run this migration in your Supabase SQL editor (DO NOT run via CLI).

-- ============================================
-- SCHEMA CHANGES
-- ============================================

-- Add 'expired' to challenge_status enum
alter type public.challenge_status add value 'expired';

-- Add expires_at column to challenges
alter table public.challenges
  add column expires_at timestamptz;

-- Index for finding expired accepted challenges
create index idx_challenges_expires_at
  on public.challenges (expires_at)
  where status = 'accepted';

-- ============================================
-- RLS: Make pending and accepted challenges publicly visible
-- ============================================

create policy "Anyone can view pending and accepted challenges"
  on public.challenges for select
  using (status in ('pending', 'accepted'));

-- ============================================
-- RPC: resolve_challenge
-- Reporter says "I Won" or "I Lost" → immediate match + Elo
-- ============================================

create or replace function public.resolve_challenge(
  p_challenge_id uuid,
  p_reporter_id uuid,
  p_reporter_won boolean
) returns uuid as $$
declare
  v_challenge record;
  v_winner_id uuid;
  v_loser_id uuid;
  v_match_id uuid;
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

  -- Validate reporter is a participant
  if p_reporter_id != v_challenge.challenger_id
     and p_reporter_id != v_challenge.challenged_id then
    raise exception 'Only challenge participants can report results';
  end if;

  -- Determine winner/loser
  if p_reporter_won then
    v_winner_id := p_reporter_id;
    v_loser_id := case
      when p_reporter_id = v_challenge.challenger_id then v_challenge.challenged_id
      else v_challenge.challenger_id
    end;
  else
    v_loser_id := p_reporter_id;
    v_winner_id := case
      when p_reporter_id = v_challenge.challenger_id then v_challenge.challenged_id
      else v_challenge.challenger_id
    end;
  end if;

  -- Delegate to record_match (handles Elo, season, challenge completion atomically)
  v_match_id := public.record_match(
    p_winner_id := v_winner_id,
    p_loser_id := v_loser_id,
    p_recorded_by := p_reporter_id,
    p_challenge_id := p_challenge_id
  );

  return v_match_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- RPC: resolve_expired_challenges
-- Forfeit: challenger wins expired accepted challenges
-- ============================================

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
    -- Challenger wins by forfeit
    perform public.record_match(
      p_winner_id := v_challenge.challenger_id,
      p_loser_id := v_challenge.challenged_id,
      p_recorded_by := v_challenge.challenger_id,
      p_challenge_id := v_challenge.id
    );

    -- Override status to 'expired' (record_match sets it to 'completed')
    update public.challenges
    set status = 'expired'
    where id = v_challenge.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$ language plpgsql security definer;
