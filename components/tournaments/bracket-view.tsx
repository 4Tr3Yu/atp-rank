"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/lib/loading-context";
import type { MatchType, TournamentMatch, Profile } from "@/lib/types/database";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function playerName(p: Profile) {
  return p.display_name || p.username;
}

function PlayerSlot({
  playerId,
  partnerId,
  profiles,
  isWinner,
  isFaded,
  isDoubles,
}: {
  playerId: string | null;
  partnerId?: string | null;
  profiles: Map<string, Profile>;
  isWinner: boolean;
  isFaded: boolean;
  isDoubles: boolean;
}) {
  const player = playerId ? profiles.get(playerId) : null;
  const partner = partnerId ? profiles.get(partnerId) : null;

  const colorClass = isWinner
    ? "bg-green-500/10 text-green-400"
    : isFaded
      ? "opacity-40"
      : "";

  if (!player) {
    return (
      <div className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${colorClass}`}>
        <span className="text-xs text-muted-foreground">TBD</span>
      </div>
    );
  }

  if (isDoubles && partner) {
    return (
      <div className={`flex flex-col gap-0.5 rounded px-2 py-1 text-sm ${colorClass}`}>
        <div className="flex items-center gap-1.5">
          <Avatar className="h-4 w-4">
            <AvatarFallback className="text-[8px]">
              {getInitials(playerName(player))}
            </AvatarFallback>
          </Avatar>
          <span className="truncate font-medium text-xs">
            {playerName(player)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Avatar className="h-4 w-4">
            <AvatarFallback className="text-[8px]">
              {getInitials(playerName(partner))}
            </AvatarFallback>
          </Avatar>
          <span className="truncate font-medium text-xs">
            {playerName(partner)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${colorClass}`}>
      <Avatar className="h-5 w-5">
        <AvatarFallback className="text-[10px]">
          {getInitials(playerName(player))}
        </AvatarFallback>
      </Avatar>
      <span className="truncate font-medium text-xs">
        {playerName(player)}
      </span>
    </div>
  );
}

function BracketMatch({
  match,
  profiles,
  currentUserId,
  canRecord,
  isDoubles,
  recordAction,
}: {
  match: TournamentMatch;
  profiles: Map<string, Profile>;
  currentUserId: string;
  canRecord: boolean;
  isDoubles: boolean;
  recordAction: (formData: FormData) => Promise<void>;
}) {
  const handleRecord = useFormAction(recordAction);
  const player1 = match.player1_id ? profiles.get(match.player1_id) : null;
  const player2 = match.player2_id ? profiles.get(match.player2_id) : null;
  const isReady = player1 && player2 && !match.winner_id;

  // For doubles win buttons, show short team name
  const team1Label = isDoubles && player1
    ? `${(playerName(player1)).split(" ")[0]} team`
    : player1
      ? `${(playerName(player1)).split(" ")[0]} wins`
      : "";
  const team2Label = isDoubles && player2
    ? `${(playerName(player2)).split(" ")[0]} team`
    : player2
      ? `${(playerName(player2)).split(" ")[0]} wins`
      : "";

  return (
    <div className={`rounded-lg border border-border bg-card p-2 ${isDoubles ? "w-56" : "w-48"} shrink-0`}>
      {/* Slot 1 */}
      <PlayerSlot
        playerId={match.player1_id}
        partnerId={match.player1_partner_id}
        profiles={profiles}
        isWinner={match.winner_id === match.player1_id}
        isFaded={!!match.winner_id && match.winner_id !== match.player1_id}
        isDoubles={isDoubles}
      />

      <div className="border-t border-border my-0.5" />

      {/* Slot 2 */}
      <PlayerSlot
        playerId={match.player2_id}
        partnerId={match.player2_partner_id}
        profiles={profiles}
        isWinner={match.winner_id === match.player2_id}
        isFaded={!!match.winner_id && match.winner_id !== match.player2_id}
        isDoubles={isDoubles}
      />

      {/* Record buttons */}
      {isReady && canRecord && (
        <div className="mt-2 flex gap-1">
          <form action={handleRecord} className="flex-1">
            <input type="hidden" name="tournament_match_id" value={match.id} />
            <input type="hidden" name="tournament_id" value={match.tournament_id} />
            <input type="hidden" name="winner_id" value={match.player1_id!} />
            <input type="hidden" name="loser_id" value={match.player2_id!} />
            <input type="hidden" name="recorded_by" value={currentUserId} />
            <Button size="sm" variant="outline" className="w-full text-xs h-7">
              {team1Label}
            </Button>
          </form>
          <form action={handleRecord} className="flex-1">
            <input type="hidden" name="tournament_match_id" value={match.id} />
            <input type="hidden" name="tournament_id" value={match.tournament_id} />
            <input type="hidden" name="winner_id" value={match.player2_id!} />
            <input type="hidden" name="loser_id" value={match.player1_id!} />
            <input type="hidden" name="recorded_by" value={currentUserId} />
            <Button size="sm" variant="outline" className="w-full text-xs h-7">
              {team2Label}
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
  matchType,
  recordAction,
}: {
  matches: TournamentMatch[];
  profiles: Map<string, Profile>;
  currentUserId: string;
  isCreator: boolean;
  matchType: MatchType;
  recordAction: (formData: FormData) => Promise<void>;
}) {
  const isDoubles = matchType === "doubles";

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
                  isDoubles={isDoubles}
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
