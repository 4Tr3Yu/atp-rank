import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/shared/back-button";
import { PlayerCard } from "@/components/profile/player-card";
import { StatsGrid } from "@/components/profile/stats-grid";
import { EloChart } from "@/components/profile/elo-chart";
import { MatchList } from "@/components/matches/match-list";
import { PlayerMedals } from "@/components/seasons/player-medals";
import { PlayerTierHistory } from "@/components/seasons/player-tier-history";
import type { Profile, Season, SeasonWinner, SeasonTierFinish } from "@/lib/types/database";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Get player's rank (only among players with matches)
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, elo_rating, wins, losses")
    .order("elo_rating", { ascending: false });

  const isRanked = profile.wins + profile.losses > 0;
  const rankedProfiles = (allProfiles || []).filter(
    (p) => p.wins + p.losses > 0,
  );
  const rank = isRanked
    ? rankedProfiles.findIndex((p) => p.id === id) + 1
    : null;

  // Fetch match history
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .or(`winner_id.eq.${id},loser_id.eq.${id}`)
    .order("played_at", { ascending: false })
    .limit(50);

  // Fetch player's medals
  const { data: medals } = await supabase
    .from("season_winners")
    .select(`
      *,
      season:seasons(id, name, slug)
    `)
    .eq("player_id", id)
    .order("awarded_at", { ascending: false });

  // Fetch player's tier finishes
  const { data: tierFinishes } = await supabase
    .from("season_tier_finishes")
    .select(`
      *,
      season:seasons(id, name, slug)
    `)
    .eq("player_id", id)
    .order("awarded_at", { ascending: false });

  // Most recent tier finish for avatar ring
  const mostRecentFinishElo = tierFinishes?.[0]?.final_elo;

  // Build profile map for match cards
  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  // Type the medals properly
  const typedMedals = (medals || []) as Array<
    SeasonWinner & { season: Pick<Season, "id" | "name" | "slug"> }
  >;

  // Type the tier finishes properly
  const typedTierFinishes = (tierFinishes || []) as Array<
    SeasonTierFinish & { season: Pick<Season, "name" | "slug"> }
  >;

  return (
    <div className="space-y-6">
      <BackButton />
      <PlayerCard profile={profile} rank={rank} seasonFinishElo={mostRecentFinishElo} />
      <StatsGrid profile={profile} matches={matches || []} />
      {typedMedals.length > 0 && <PlayerMedals medals={typedMedals} />}
      {typedTierFinishes.length > 0 && <PlayerTierHistory tierFinishes={typedTierFinishes} />}
      <EloChart matches={matches || []} playerId={id} />
      <div>
        <h2 className="mb-3 text-lg font-semibold">Match History</h2>
        <MatchList matches={matches || []} profiles={profileMap} />
      </div>
    </div>
  );
}
