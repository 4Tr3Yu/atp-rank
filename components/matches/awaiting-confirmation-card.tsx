import Link from "next/link";
import type { Match, Profile } from "@/lib/types/database";

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

export function AwaitingConfirmationCard({
  match,
  winner,
  loser,
  currentUserId,
}: {
  match: Match;
  winner: Profile;
  loser: Profile;
  currentUserId: string;
}) {
  const isWinner = currentUserId === match.winner_id;
  const opponent = isWinner ? loser : winner;
  const eloChange = match.elo_change;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">
          <span className="text-muted-foreground">vs</span>{" "}
          <Link
            href={`/player/${opponent.id}`}
            className="hover:underline"
          >
            {opponent.display_name || opponent.username}
          </Link>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {timeAgo(match.played_at)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-semibold tabular-nums ${
            isWinner ? "text-green-400" : "text-red-400"
          }`}
        >
          {isWinner ? "+" : "-"}{eloChange}
        </p>
        <p className="text-[10px] text-yellow-400/80">pending</p>
      </div>
    </div>
  );
}
