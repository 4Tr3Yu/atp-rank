import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { MatchList } from "@/components/matches/match-list";
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

  // Profile map for match display
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  return (
    <div className="space-y-6">
      {/* Season Hero */}
      {activeSeason && <SeasonHero season={activeSeason as Season} />}

      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          {activeSeason && (
            <SeasonTag season={activeSeason as Season} />
          )}
        </div>
        <p className="text-muted-foreground">
          Current rankings based on Elo rating
        </p>
      </div>
      <LeaderboardTable profiles={profiles || []} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Matches</h2>
        <MatchList matches={recentMatches || []} profiles={profileMap} layout="grid"/>
      </div>
    </div>
  );
}
