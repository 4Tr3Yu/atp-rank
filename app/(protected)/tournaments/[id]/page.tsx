import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
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
import type { Profile } from "@/lib/types/database";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-muted text-muted-foreground border-border",
};

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

  const isCreator = user!.id === tournament.created_by;
  const isParticipant = (participants || []).some(
    (p) => p.player_id === user!.id
  );
  const isOpen = tournament.status === "open";
  const isInProgress = tournament.status === "in_progress";
  const isFull =
    (participants || []).length >= tournament.max_players;
  const canJoin = isOpen && !isParticipant && !isFull;
  const canLeave = isOpen && isParticipant && !isCreator;
  const canStart =
    isOpen && isCreator && (participants || []).length >= 2;

  return (
    <div className="space-y-6">
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
          canJoin={canJoin}
          canLeave={canLeave}
          canStart={canStart}
          joinAction={joinTournament}
          leaveAction={leaveTournament}
          startAction={startTournament}
        />
      </div>

      <Separator />

      {/* Participants */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Players ({(participants || []).length} / {tournament.max_players})
        </h2>
        <div className="flex flex-wrap gap-2">
          {(participants || []).map((p) => {
            const profile = profileMap.get(p.player_id);
            if (!profile) return null;
            return (
              <Link
                key={p.id}
                href={`/player/${profile.id}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-primary/30"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {(profile.display_name || profile.username)
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {profile.display_name || profile.username}
                </span>
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
              </Link>
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
            recordAction={recordTournamentMatch}
          />
        </div>
      )}
    </div>
  );
}
