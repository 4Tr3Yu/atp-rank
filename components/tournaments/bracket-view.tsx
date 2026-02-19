"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/lib/loading-context";
import type { TournamentMatch, Profile } from "@/lib/types/database";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function BracketMatch({
  match,
  profiles,
  currentUserId,
  canRecord,
  recordAction,
}: {
  match: TournamentMatch;
  profiles: Map<string, Profile>;
  currentUserId: string;
  canRecord: boolean;
  recordAction: (formData: FormData) => Promise<void>;
}) {
  const handleRecord = useFormAction(recordAction);
  const player1 = match.player1_id ? profiles.get(match.player1_id) : null;
  const player2 = match.player2_id ? profiles.get(match.player2_id) : null;
  const isReady = player1 && player2 && !match.winner_id;

  return (
    <div className="rounded-lg border border-border bg-card p-2 w-48 shrink-0">
      {/* Player 1 */}
      <div
        className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
          match.winner_id === match.player1_id
            ? "bg-green-500/10 text-green-400"
            : match.winner_id && match.winner_id !== match.player1_id
              ? "opacity-40"
              : ""
        }`}
      >
        {player1 ? (
          <>
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {getInitials(player1.display_name || player1.username)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium text-xs">
              {player1.display_name || player1.username}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">TBD</span>
        )}
      </div>

      <div className="border-t border-border my-0.5" />

      {/* Player 2 */}
      <div
        className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
          match.winner_id === match.player2_id
            ? "bg-green-500/10 text-green-400"
            : match.winner_id && match.winner_id !== match.player2_id
              ? "opacity-40"
              : ""
        }`}
      >
        {player2 ? (
          <>
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {getInitials(player2.display_name || player2.username)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium text-xs">
              {player2.display_name || player2.username}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">TBD</span>
        )}
      </div>

      {/* Record buttons */}
      {isReady && canRecord && (
        <div className="mt-2 flex gap-1">
          <form action={handleRecord} className="flex-1">
            <input type="hidden" name="tournament_match_id" value={match.id} />
            <input
              type="hidden"
              name="tournament_id"
              value={match.tournament_id}
            />
            <input type="hidden" name="winner_id" value={match.player1_id!} />
            <input type="hidden" name="loser_id" value={match.player2_id!} />
            <input type="hidden" name="recorded_by" value={currentUserId} />
            <Button size="sm" variant="outline" className="w-full text-xs h-7">
              {(player1?.display_name || player1?.username || "").split(" ")[0]} wins
            </Button>
          </form>
          <form action={handleRecord} className="flex-1">
            <input type="hidden" name="tournament_match_id" value={match.id} />
            <input
              type="hidden"
              name="tournament_id"
              value={match.tournament_id}
            />
            <input type="hidden" name="winner_id" value={match.player2_id!} />
            <input type="hidden" name="loser_id" value={match.player1_id!} />
            <input type="hidden" name="recorded_by" value={currentUserId} />
            <Button size="sm" variant="outline" className="w-full text-xs h-7">
              {(player2?.display_name || player2?.username || "").split(" ")[0]} wins
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

export function BracketView({
  matches,
  profiles,
  currentUserId,
  isCreator,
  recordAction,
}: {
  matches: TournamentMatch[];
  profiles: Map<string, Profile>;
  currentUserId: string;
  isCreator: boolean;
  recordAction: (formData: FormData) => Promise<void>;
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Bracket will appear once the tournament starts.
      </div>
    );
  }

  // Group matches by round
  const rounds = new Map<number, TournamentMatch[]>();
  for (const match of matches) {
    const roundMatches = rounds.get(match.round) || [];
    roundMatches.push(match);
    rounds.set(match.round, roundMatches);
  }

  // Sort rounds and matches within rounds
  const sortedRounds = [...rounds.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, roundMatches]) => ({
      round,
      matches: roundMatches.sort((a, b) => a.position - b.position),
    }));

  const roundLabels = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Final";
    if (round === totalRounds - 1) return "Semifinals";
    if (round === totalRounds - 2) return "Quarterfinals";
    return `Round ${round}`;
  };

  const totalRounds = sortedRounds.length;

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max py-2">
        {sortedRounds.map(({ round, matches: roundMatches }) => (
          <div key={round} className="flex flex-col gap-4">
            <p className="text-xs font-medium text-muted-foreground text-center">
              {roundLabels(round, totalRounds)}
            </p>
            <div className="flex flex-col justify-around gap-4 flex-1">
              {roundMatches.map((match) => (
                <BracketMatch
                  key={match.id}
                  match={match}
                  profiles={profiles}
                  currentUserId={currentUserId}
                  canRecord={isCreator}
                  recordAction={recordAction}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
