import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { MatchList } from "@/components/matches/match-list";
import { ActiveChallenges } from "@/components/challenges/active-challenges";
import { SeasonHero } from "@/components/seasons/season-hero";
import { SeasonTag } from "@/components/seasons/season-badge";
import type { Profile, Season } from "@/lib/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch active season
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .single();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("elo_rating", { ascending: false });

  const { data: recentMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "confirmed")
    .order("played_at", { ascending: false })
    .limit(5);

  // Fetch most recent completed season's tier finishes
  const { data: lastCompletedSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "completed")
    .order("ends_at", { ascending: false })
    .limit(1)
    .single();

  const tierFinishes = new Map<string, number>();
  if (lastCompletedSeason) {
    const { data: finishes } = await supabase
      .from("season_tier_finishes")
      .select("player_id, final_elo")
      .eq("season_id", lastCompletedSeason.id);

    for (const f of finishes || []) {
      tierFinishes.set(f.player_id, f.final_elo);
    }
  }

  // Profile map for match display
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  return (
    <div className="space-y-6">
      {/* Season Hero */}
      {activeSeason && <SeasonHero season={activeSeason as Season} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
              {activeSeason && (
                <SeasonTag season={activeSeason as Season} />
              )}
            </div>
          </div>
          <LeaderboardTable profiles={profiles || []} tierFinishes={tierFinishes} />
        </div>

        <div className="lg:col-span-1">
          <ActiveChallenges />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Matches</h2>
        <MatchList matches={recentMatches || []} profiles={profileMap} layout="grid"/>
      </div>
    </div>
  );
}
