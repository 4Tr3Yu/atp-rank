import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { MatchList } from "@/components/matches/match-list";
import type { Profile } from "@/lib/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("elo_rating", { ascending: false });

  const { data: recentMatches } = await supabase
    .from("matches")
    .select("*")
    .order("played_at", { ascending: false })
    .limit(5);

  // Profile map for match display
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
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
