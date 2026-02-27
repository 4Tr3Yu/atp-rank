import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/shared/back-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { BracketView } from "@/components/tournaments/bracket-view";
import { TournamentActions } from "@/components/tournaments/tournament-actions";
import {
  joinTournament,
  leaveTournament,
  startTournament,
  recordTournamentMatch,
} from "../actions";
import type { Profile, TournamentResult } from "@/lib/types/database";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-muted text-muted-foreground border-border",
};

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function playerName(profile: Profile) {
  return profile.display_name || profile.username;
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (!tournament) notFound();

  const isDoubles = tournament.match_type === "doubles";

  const { data: participants } = await supabase
    .from("tournament_participants")
    .select("*")
    .eq("tournament_id", id)
    .order("seed", { ascending: true });

  const { data: bracketMatches } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", id)
    .order("round", { ascending: true })
    .order("position", { ascending: true });

  // Profile map
  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  // Tournament results (placement + Elo bonus) for completed tournaments
  let tournamentResults: TournamentResult[] = [];
  if (tournament.status === "completed") {
    const { data } = await supabase
      .from("tournament_results")
      .select("*")
      .eq("tournament_id", id);
    tournamentResults = data || [];
  }
  const resultsMap = new Map<string, TournamentResult>();
  for (const r of tournamentResults) {
    resultsMap.set(r.player_id, r);
  }

  const isCreator = user!.id === tournament.created_by;

  // For doubles, check if user is player_id OR partner_id in any participant row
  const isParticipant = (participants || []).some(
    (p) => p.player_id === user!.id || p.partner_id === user!.id
  );

  const isOpen = tournament.status === "open";
  const isInProgress = tournament.status === "in_progress";
  const isFull =
    (participants || []).length >= tournament.max_players;
  const canJoin = isOpen && !isParticipant && !isFull;
  const canLeave = isOpen && isParticipant && !isCreator;
  const canStart =
    isOpen && isCreator && (participants || []).length >= 2;

  // Collect existing player IDs (for doubles join exclusion)
  const existingPlayerIds: string[] = [];
  for (const p of participants || []) {
    existingPlayerIds.push(p.player_id);
    if (p.partner_id) existingPlayerIds.push(p.partner_id);
  }

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {tournament.name}
            </h1>
            <Badge
              variant="outline"
              className={statusColors[tournament.status]}
            >
              {tournament.status.replace("_", " ")}
            </Badge>
            {isDoubles && (
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                2v2
              </Badge>
            )}
          </div>
          {tournament.description && (
            <p className="text-muted-foreground mt-1">
              {tournament.description}
            </p>
          )}
        </div>
        <TournamentActions
          tournamentId={id}
          userId={user!.id}
          matchType={tournament.match_type}
          canJoin={canJoin}
          canLeave={canLeave}
          canStart={canStart}
          joinAction={joinTournament}
          leaveAction={leaveTournament}
          startAction={startTournament}
          players={profiles || []}
          existingPlayerIds={existingPlayerIds}
        />
      </div>

      <Separator />

      {/* Participants */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          {isDoubles ? "Teams" : "Players"} ({(participants || []).length} / {tournament.max_players})
        </h2>
        <div className="flex flex-wrap gap-2">
          {(participants || []).map((p) => {
            const profile = profileMap.get(p.player_id);
            if (!profile) return null;
            const partner = p.partner_id ? profileMap.get(p.partner_id) : null;

            return (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-primary/30"
              >
                <Link href={`/player/${profile.id}`} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {getInitials(playerName(profile))}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {playerName(profile)}
                  </span>
                </Link>
                {isDoubles && partner && (
                  <>
                    <span className="text-xs text-muted-foreground">&</span>
                    <Link href={`/player/${partner.id}`} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(playerName(partner))}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {playerName(partner)}
                      </span>
                    </Link>
                  </>
                )}
                {isDoubles && partner && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {profile.elo_rating + partner.elo_rating}
                  </span>
                )}
                {p.seed && (
                  <span className="text-xs text-muted-foreground">
                    #{p.seed}
                  </span>
                )}
                {p.eliminated && (
                  <Badge variant="outline" className="text-xs opacity-50">
                    Out
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bracket */}
      {(isInProgress || tournament.status === "completed") && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Bracket</h2>
          <BracketView
            matches={bracketMatches || []}
            profiles={profileMap}
            currentUserId={user!.id}
            isCreator={isCreator}
            matchType={tournament.match_type}
            recordAction={recordTournamentMatch}
            results={resultsMap}
          />
        </div>
      )}

      {/* Tournament Results Summary */}
      {tournament.status === "completed" && tournamentResults.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Results</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {tournamentResults
              .sort((a, b) => b.elo_bonus - a.elo_bonus)
              .map((result, i) => {
                const profile = profileMap.get(result.player_id);
                if (!profile) return null;
                const initials = (profile.display_name || profile.username)
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div
                    key={result.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6 text-center">
                        {result.position_label === "Champion"
                          ? "🥇"
                          : result.position_label === "Runner-up"
                            ? "🥈"
                            : result.position_label === "Semifinalist"
                              ? "🥉"
                              : `${i + 1}.`}
                      </span>
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {profile.display_name || profile.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.position_label}
                        </p>
                      </div>
                    </div>
                    {result.elo_bonus > 0 && (
                      <span className="text-sm font-semibold text-green-400">
                        +{result.elo_bonus} Elo
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
