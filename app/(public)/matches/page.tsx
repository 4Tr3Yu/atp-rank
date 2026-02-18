import { createClient } from "@/lib/supabase/server";
import { MatchList } from "@/components/matches/match-list";
import type { Profile } from "@/lib/types/database";

export default async function MatchesPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("played_at", { ascending: false })
    .limit(50);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*");

  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recent Matches</h1>
        <p className="text-muted-foreground">Latest games played</p>
      </div>
      <MatchList matches={matches || []} profiles={profileMap} />
    </div>
  );
}
