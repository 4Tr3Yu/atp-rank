import Link from "next/link";
import { zenDots } from "@/lib/fonts";
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
  layout,
}: {
  match: Match;
  winner: Profile;
  loser: Profile;
  layout?: "list" | "grid";
}) {
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
              {getInitials(winner.display_name || winner.username)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0">
          <p className="text-lg font-medium truncate">
            {winner.display_name || winner.username}
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
              {getInitials(loser.display_name || loser.username)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0">
          <p className="text-lg font-medium truncate">
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
