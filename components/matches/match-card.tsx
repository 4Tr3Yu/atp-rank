import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Match, Profile } from "@/lib/types/database";

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

export function MatchCard({
  match,
  winner,
  loser,
}: {
  match: Match;
  winner: Profile;
  loser: Profile;
}) {
  return (
    <div className="flex items-center justify-around gap-4 rounded-xl border border-border bg-card p-4 bg-linear-to-br from-orange-500/45 to-black">
      {/* Winner */}
      <Link
        href={`/player/${winner.id}`}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-green-500/10 text-green-400 text-xs">
            {getInitials(winner.display_name || winner.username)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {winner.display_name || winner.username}
          </p>
          <p className="text-xs text-green-400 tabular-nums">
            +{match.elo_change}
          </p>
        </div>
      </Link>
      {/* VS */}
      <div className="flex flex-col items-center gap-1 linme">
        <span className="text-2xl font-bold  shrink-0">
          VS.
        </span>
        <span className="ml-auto text-xs text-muted-foreground shrink-0">
          {timeAgo(match.played_at)}
        </span>
      </div>
      {/* Loser */}
      <Link
        href={`/player/${loser.id}`}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-red-500/10 text-red-400 text-xs">
            {getInitials(loser.display_name || loser.username)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {loser.display_name || loser.username}
          </p>
          <p className="text-xs text-red-400 tabular-nums">
            -{match.elo_change}
          </p>
        </div>
      </Link>
    </div>
  );
}
