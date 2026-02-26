import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MatchList } from "@/components/matches/match-list";
import { AwaitingConfirmationList } from "@/components/matches/awaiting-confirmation-list";
import { ChallengeList } from "@/components/challenges/challenge-list";
import { RecordMatchTrigger } from "@/components/matches/record-match-trigger";
import { CreateChallengeTrigger } from "@/components/challenges/create-challenge-trigger";
import { NavCards } from "@/components/layout/nav-cards";
import { TierBadge } from "@/components/shared/tier-badge";
import { SeasonBanner } from "@/components/seasons/season-banner";
import {
  respondToChallenge,
  cancelChallenge,
  resolveChallenge,
} from "@/app/(protected)/challenges/actions";
import { resolveExpiredChallenges } from "@/lib/challenges";
import type { Profile, Season } from "@/lib/types/database";

export default async function DashboardPage() {
  // Resolve any expired challenges before fetching
  await resolveExpiredChallenges();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch active season
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .single();

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

  // Recent matches for this user (confirmed only)
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "confirmed")
    .or(`winner_id.eq.${user!.id},loser_id.eq.${user!.id}`)
    .order("played_at", { ascending: false })
    .limit(5);

  // Pending matches awaiting user's confirmation
  const { data: pendingMatches } = await supabase
    .from("matches")
    .select("id")
    .eq("status", "pending")
    .or(`winner_id.eq.${user!.id},loser_id.eq.${user!.id}`)
    .neq("recorded_by", user!.id);

  const pendingMatchCount = (pendingMatches || []).length;

  // Matches recorded by user awaiting opponent confirmation
  const { data: awaitingConfirmation } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "pending")
    .eq("recorded_by", user!.id)
    .order("played_at", { ascending: false });

  // Pending challenges received
  const { data: pendingChallenges } = await supabase
    .from("challenges")
    .select("*")
    .eq("challenged_id", user!.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Active challenges (accepted, involving current user)
  const { data: activeChallenges } = await supabase
    .from("challenges")
    .select("*")
    .eq("status", "accepted")
    .or(`challenger_id.eq.${user!.id},challenged_id.eq.${user!.id}`)
    .order("expires_at", { ascending: true });

  // Profile map
  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  // Calculate all-time stats
  const totalWins = profile?.total_wins ?? profile?.wins ?? 0;
  const totalLosses = profile?.total_losses ?? profile?.losses ?? 0;

  return (
    <div className="space-y-6">

      <header className="flex justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.display_name || user?.email}
            </p>
        </div>
        {/* Season banner */}
        <div className="hidden sm:block">
          {activeSeason && <SeasonBanner season={activeSeason as Season} />}      
        </div>
      </header>
        <div className="sm:hidden">
        {activeSeason && <SeasonBanner season={activeSeason as Season} />}      
      </div>

      {/* Navigation cards */}
      <NavCards pendingMatchCount={pendingMatchCount} />

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <RecordMatchTrigger />
          <CreateChallengeTrigger variant="inverted" />
        </div>
      </div>

      {/* Stats and Awaiting Confirmation - 2 columns on desktop */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick stats */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-6 text-center space-y-1">
                <p className="text-4xl font-bold text-primary tabular-nums">
                  {profile?.elo_rating || 1200}
                </p>
                <TierBadge eloRating={profile?.elo_rating || 1200} showLabel />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold tabular-nums">
                  #{rank || "-"}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
                    / {totalPlayers}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">Rank</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold tabular-nums">
                  <span className="text-green-400">{profile?.wins || 0}</span>
                  {" / "}
                  <span className="text-red-400">{profile?.losses || 0}</span>
                </p>
                <p className="text-sm text-muted-foreground">Season W / L</p>
                <p className="text-xs text-muted-foreground/70">
                  All-time: {totalWins}-{totalLosses}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold tabular-nums">
                  {(profile?.wins || 0) + (profile?.losses || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Season Matches</p>
                <p className="text-xs text-muted-foreground/70">
                  All-time: {totalWins + totalLosses}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Matches awaiting opponent confirmation */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Awaiting Confirmation</h2>
          {(awaitingConfirmation || []).length > 0 ? (
            <AwaitingConfirmationList
              matches={awaitingConfirmation || []}
              profiles={profileMap}
              currentUserId={user!.id}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No matches awaiting confirmation
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Active challenges */}
      {(activeChallenges || []).length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Challenges</h2>
            <Link
              href="/challenges"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <ChallengeList
            challenges={activeChallenges || []}
            profiles={profileMap}
            currentUserId={user!.id}
            respondAction={respondToChallenge}
            cancelAction={cancelChallenge}
            resolveAction={resolveChallenge}
          />
        </div>
      )}

      {/* Pending challenges */}
      {(pendingChallenges || []).length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending Challenges</h2>
            <Link
              href="/challenges"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <ChallengeList
            challenges={pendingChallenges || []}
            profiles={profileMap}
            currentUserId={user!.id}
            respondAction={respondToChallenge}
            cancelAction={cancelChallenge}
          />
        </div>
      )}

      {/* Recent matches */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Matches</h2>
        <MatchList matches={matches || []} profiles={profileMap} />
      </div>
    </div>
  );
}
