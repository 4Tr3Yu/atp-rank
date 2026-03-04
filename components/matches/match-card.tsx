import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { zenDots } from "@/lib/fonts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

function TeamDisplay({
  players,
  changes,
  isWinner,
}: {
  players: Profile[];
  changes: number[];
  isWinner: boolean;
}) {
  const colorClass = isWinner ? "text-green-400" : "text-red-400";
  const sign = isWinner ? "+" : "-";

  return (
    <div className="relative z-20 flex flex-col items-center gap-1">
      {players.map((p, i) => (
        <Link
          key={p.id}
          href={`/player/${p.id}`}
          className="hover:opacity-80 transition-opacity text-center"
        >
          <p className="text-base font-medium truncate">
            {playerName(p)}
          </p>
          <p className={`text-xs ${colorClass} tabular-nums`}>
            {sign}{Math.abs(changes[i])}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function MatchCard({
  match,
  winner,
  loser,
  matchPlayers,
  profiles,
  layout,
}: {
  match: Match;
  winner: Profile;
  loser: Profile;
  matchPlayers?: MatchPlayer[];
  profiles?: Map<string, Profile>;
  layout?: "list" | "grid";
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

    const winnerChanges = matchPlayers
      .filter((mp) => mp.team === "winner")
      .map((mp) => mp.elo_change);
    const loserChanges = matchPlayers
      .filter((mp) => mp.team === "loser")
      .map((mp) => mp.elo_change);

    return (
      <div className={`relative flex items-center justify-around gap-4 rounded-xl border border-border p-4 overflow-hidden ${zenDots.className}`}>
        <div className="absolute inset-0 bg-zinc-900/80" />
        <div className="absolute inset-0 bg-orange-500/40 origin-top-left -skew-x-12" style={{ clipPath: "polygon(0 0, 60% 0, 40% 100%, 0 100%)" }} />

        <TeamDisplay players={winnerPlayers} changes={winnerChanges} isWinner />

        <div className="relative z-20 flex flex-col items-center gap-1">
          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-1">
            2v2
          </Badge>
          <span className={`shrink-0 drop-shadow-lg ${layout === "grid" ? "text-3xl" : "text-5xl"}`}>
            VS
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {timeAgo(match.played_at)}
          </span>
        </div>

        <TeamDisplay players={loserPlayers} changes={loserChanges} isWinner={false} />
      </div>
    );
  }

  // Singles layout (unchanged)
  return (
    <div className={`relative flex items-center justify-around gap-4 rounded-xl border border-border p-4 overflow-hidden ${zenDots.className}`}>
      {/* Diagonal split background */}
      <div className="absolute inset-0 bg-zinc-900/80" />
      <div className="absolute inset-0 bg-orange-500/40 origin-top-left -skew-x-12" style={{ clipPath: "polygon(0 0, 60% 0, 40% 100%, 0 100%)" }} />

      {/* Winner */}
      <Link
        href={`/player/${winner.id}`}
        className="relative z-20 flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {layout !== "grid" && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-500/10 text-green-400 text-xs">
              {getInitials(playerName(winner))}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0">
          <p className="text-lg font-medium truncate">
            {playerName(winner)}
          </p>
          <p className="text-xs text-green-400 tabular-nums">
            +{match.elo_change}
          </p>
        </div>
      </Link>
      {/* VS */}
      <div className="relative z-20 flex flex-col items-center gap-1">
        <span className={`shrink-0 drop-shadow-lg ${layout === "grid" ? "text-3xl" : "text-5xl"}`}>
          VS
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {timeAgo(match.played_at)}
        </span>
      </div>
      {/* Loser */}
      <Link
        href={`/player/${loser.id}`}
        className="relative z-20 flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {layout !== "grid" && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-red-500/10 text-red-400 text-xs">
              {getInitials(playerName(loser))}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0">
          <p className="text-lg font-medium truncate">
            {playerName(loser)}
          </p>
          <p className="text-xs text-red-400 tabular-nums">
            -{match.loser_elo_change ?? match.elo_change}
          </p>
        </div>
      </Link>
    </div>
  );
}
