import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MatchList } from "@/components/matches/match-list";
import type { Profile } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch current user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  // Get rank
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, elo_rating")
    .order("elo_rating", { ascending: false });

  const rank = (allProfiles || []).findIndex((p) => p.id === user!.id) + 1;
  const totalPlayers = (allProfiles || []).length;

  // Recent matches for this user
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .or(`winner_id.eq.${user!.id},loser_id.eq.${user!.id}`)
    .order("played_at", { ascending: false })
    .limit(5);

  // Profile map for match cards
  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.display_name || user?.email}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">
              {profile?.elo_rating || 1200}
            </p>
            <p className="text-xs text-muted-foreground">Elo Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              #{rank || "-"}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {totalPlayers}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Rank</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              <span className="text-green-400">{profile?.wins || 0}</span>
              {" / "}
              <span className="text-red-400">{profile?.losses || 0}</span>
            </p>
            <p className="text-xs text-muted-foreground">W / L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {(profile?.wins || 0) + (profile?.losses || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Matches</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/matches/new">Record Match</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/challenges/new">Send Challenge</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tournaments">Tournaments</Link>
        </Button>
      </div>

      {/* Recent matches */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Matches</h2>
        <MatchList matches={matches || []} profiles={profileMap} />
      </div>
    </div>
  );
}
