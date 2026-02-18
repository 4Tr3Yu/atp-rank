-- ATP Rank: Initial Schema
-- Run this migration in your Supabase SQL editor

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  elo_rating    integer not null default 1200,
  wins          integer not null default 0,
  losses        integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- CHALLENGES
-- ============================================
create type public.challenge_status as enum ('pending', 'accepted', 'declined', 'completed', 'cancelled');

create table public.challenges (
  id              uuid primary key default gen_random_uuid(),
  challenger_id   uuid not null references public.profiles(id) on delete cascade,
  challenged_id   uuid not null references public.profiles(id) on delete cascade,
  status          public.challenge_status not null default 'pending',
  message         text,
  created_at      timestamptz not null default now(),
  responded_at    timestamptz,
  completed_at    timestamptz,

  constraint different_challenge_players check (challenger_id != challenged_id)
);

alter table public.challenges enable row level security;

create policy "Users can view own challenges"
  on public.challenges for select
  using (auth.uid() = challenger_id or auth.uid() = challenged_id);

create policy "Users can create challenges"
  on public.challenges for insert
  with check (auth.uid() = challenger_id);

create policy "Involved users can update challenges"
  on public.challenges for update
  using (auth.uid() = challenger_id or auth.uid() = challenged_id);

-- ============================================
-- TOURNAMENTS
-- ============================================
create type public.tournament_status as enum ('draft', 'open', 'in_progress', 'completed');

create table public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  status          public.tournament_status not null default 'draft',
  max_players     integer not null default 8,
  created_by      uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  completed_at    timestamptz
);

alter table public.tournaments enable row level security;

create policy "Tournaments viewable by everyone"
  on public.tournaments for select using (true);

create policy "Authenticated users can create tournaments"
  on public.tournaments for insert with check (auth.uid() = created_by);

create policy "Creator can update tournament"
  on public.tournaments for update using (auth.uid() = created_by);

-- ============================================
-- TOURNAMENT PARTICIPANTS
-- ============================================
create table public.tournament_participants (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references public.tournaments(id) on delete cascade,
  player_id       uuid not null references public.profiles(id) on delete cascade,
  seed            integer,
  eliminated      boolean not null default false,
  joined_at       timestamptz not null default now(),

  unique(tournament_id, player_id)
);

alter table public.tournament_participants enable row level security;

create policy "Tournament participants viewable by everyone"
  on public.tournament_participants for select using (true);

create policy "Users can join tournaments"
  on public.tournament_participants for insert
  with check (auth.uid() = player_id);

create policy "Creator or self can update participant"
  on public.tournament_participants for update
  using (
    auth.uid() = player_id
    or auth.uid() = (select created_by from public.tournaments where id = tournament_id)
  );

-- ============================================
-- TOURNAMENT MATCHES
-- ============================================
create table public.tournament_matches (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references public.tournaments(id) on delete cascade,
  round           integer not null,
  position        integer not null,
  player1_id      uuid references public.profiles(id) on delete set null,
  player2_id      uuid references public.profiles(id) on delete set null,
  winner_id       uuid references public.profiles(id) on delete set null,
  match_id        uuid,  -- FK added after matches table is created
  scheduled_at    timestamptz,

  unique(tournament_id, round, position)
);

alter table public.tournament_matches enable row level security;

create policy "Tournament matches viewable by everyone"
  on public.tournament_matches for select using (true);

create policy "Tournament creator can manage matches"
  on public.tournament_matches for all
  using (
    auth.uid() = (select created_by from public.tournaments where id = tournament_id)
  );

-- ============================================
-- MATCHES
-- ============================================
create table public.matches (
  id                  uuid primary key default gen_random_uuid(),
  winner_id           uuid not null references public.profiles(id) on delete cascade,
  loser_id            uuid not null references public.profiles(id) on delete cascade,
  winner_elo_before   integer not null,
  loser_elo_before    integer not null,
  elo_change          integer not null,
  challenge_id        uuid references public.challenges(id) on delete set null,
  tournament_match_id uuid references public.tournament_matches(id) on delete set null,
  played_at           timestamptz not null default now(),
  recorded_by         uuid not null references public.profiles(id) on delete cascade,

  constraint different_players check (winner_id != loser_id)
);

-- Add FK from tournament_matches back to matches
alter table public.tournament_matches
  add constraint tournament_matches_match_id_fkey
  foreign key (match_id) references public.matches(id) on delete set null;

alter table public.matches enable row level security;

create policy "Matches are viewable by everyone"
  on public.matches for select using (true);

create policy "Authenticated users can record matches"
  on public.matches for insert with check (auth.uid() = recorded_by);

-- ============================================
-- RECORD MATCH RPC (atomic Elo update)
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
  v_expected float;
  v_change integer;
  v_match_id uuid;
begin
  -- Lock and get current ratings
  select elo_rating into v_winner_elo from public.profiles where id = p_winner_id for update;
  select elo_rating into v_loser_elo from public.profiles where id = p_loser_id for update;

  -- Calculate Elo change (K=32)
  v_expected := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::float / 400.0));
  v_change := greatest(1, round(32 * (1.0 - v_expected)));

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
-- INDEXES
-- ============================================
create index idx_matches_winner on public.matches(winner_id);
create index idx_matches_loser on public.matches(loser_id);
create index idx_matches_played_at on public.matches(played_at desc);
create index idx_challenges_challenger on public.challenges(challenger_id);
create index idx_challenges_challenged on public.challenges(challenged_id);
create index idx_challenges_status on public.challenges(status);
create index idx_tournament_participants_tournament on public.tournament_participants(tournament_id);
create index idx_tournament_matches_tournament on public.tournament_matches(tournament_id);
create index idx_profiles_elo on public.profiles(elo_rating desc);
