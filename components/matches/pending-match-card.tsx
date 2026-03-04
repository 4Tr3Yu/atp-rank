import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PendingMatchActions } from "./pending-match-actions";
import type { Match, MatchPlayer, Profile } from "@/lib/types/database";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function playerName(p: Profile) {
  return p.display_name || p.username;
}

export function PendingMatchCard({
  match,
  winner,
  loser,
  recorder,
  currentUserId,
  confirmAction,
  declineAction,
  matchPlayers,
  profiles,
}: {
  match: Match;
  winner: Profile;
  loser: Profile;
  recorder: Profile;
  currentUserId: string;
  confirmAction: (formData: FormData) => Promise<void>;
  declineAction: (formData: FormData) => Promise<void>;
  matchPlayers?: MatchPlayer[];
  profiles?: Map<string, Profile>;
}) {
  const isDoubles = match.match_type === "doubles" && matchPlayers && profiles;

  if (isDoubles) {
    const winnerPlayers = matchPlayers
      .filter((mp) => mp.team === "winner")
      .map((mp) => profiles.get(mp.player_id))
      .filter(Boolean) as Profile[];
    const loserPlayers = matchPlayers
      .filter((mp) => mp.team === "loser")
      .map((mp) => profiles.get(mp.player_id))
      .filter(Boolean) as Profile[];

    const isOnWinnerTeam = matchPlayers.some(
      (mp) => mp.player_id === currentUserId && mp.team === "winner"
    );
    const myChange = matchPlayers.find(
      (mp) => mp.player_id === currentUserId
    )?.elo_change ?? match.elo_change;

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">
              {winnerPlayers.map((p) => playerName(p)).join(" & ")}
              <span className="text-muted-foreground mx-1.5">vs</span>
              {loserPlayers.map((p) => playerName(p)).join(" & ")}
            </p>
            <Badge
              variant="outline"
              className={
                isOnWinnerTeam
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }
            >
              {isOnWinnerTeam ? "Your team won" : "Your team lost"}
            </Badge>
            <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              2v2
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-sm font-medium tabular-nums ${
                isOnWinnerTeam ? "text-green-400" : "text-red-400"
              }`}
            >
              ~{isOnWinnerTeam ? "+" : "-"}{Math.abs(myChange)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Recorded by {playerName(recorder)} • {timeAgo(match.played_at)}
          </p>
        </div>

        <PendingMatchActions
          match={match}
          confirmAction={confirmAction}
          declineAction={declineAction}
        />
      </div>
    );
  }

  // Singles (existing layout)
  const isWinner = currentUserId === match.winner_id;
  const opponent = isWinner ? loser : winner;
  const eloChange = isWinner ? match.elo_change : (match.loser_elo_change ?? match.elo_change);
  const currentElo = isWinner ? match.winner_elo_before : match.loser_elo_before;
  const newElo = isWinner
    ? currentElo + eloChange
    : Math.max(100, currentElo - eloChange);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link
          href={`/player/${opponent.id}`}
          className="shrink-0 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(playerName(opponent))}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">
              vs{" "}
              <Link
                href={`/player/${opponent.id}`}
                className="hover:underline"
              >
                {playerName(opponent)}
              </Link>
            </p>
            <Badge
              variant="outline"
              className={
                isWinner
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }
            >
              {isWinner ? "You won" : "You lost"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-sm font-medium tabular-nums ${
                isWinner ? "text-green-400" : "text-red-400"
              }`}
            >
              ~{isWinner ? "+" : "-"}{eloChange}
            </span>
            <span className="text-xs text-muted-foreground">
              ({currentElo} → {newElo})
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Recorded by {playerName(recorder)} • {timeAgo(match.played_at)}
          </p>
        </div>
      </div>

      <PendingMatchActions
        match={match}
        confirmAction={confirmAction}
        declineAction={declineAction}
      />
    </div>
  );
}
