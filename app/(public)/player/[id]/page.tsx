import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/shared/back-button";
import { PlayerCard } from "@/components/profile/player-card";
import { StatsGrid } from "@/components/profile/stats-grid";
import { EloChart } from "@/components/profile/elo-chart";
import { MatchList } from "@/components/matches/match-list";
import type { Profile } from "@/lib/types/database";

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

  // Get player's rank
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, elo_rating")
    .order("elo_rating", { ascending: false });

  const rank = (allProfiles || []).findIndex((p) => p.id === id) + 1;

  // Fetch match history
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .or(`winner_id.eq.${id},loser_id.eq.${id}`)
    .order("played_at", { ascending: false })
    .limit(50);

  // Build profile map for match cards
  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <PlayerCard profile={profile} rank={rank} />
      <StatsGrid profile={profile} matches={matches || []} />
      <EloChart matches={matches || []} playerId={id} />
      <div>
        <h2 className="mb-3 text-lg font-semibold">Match History</h2>
        <MatchList matches={matches || []} profiles={profileMap} />
      </div>
    </div>
  );
}
