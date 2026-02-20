import Link from "next/link";
import { MedalIcon } from "@/components/shared/medal-badge";
import type { MedalType, Profile, SeasonWinner } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface PodiumProps {
  winners: Array<
    SeasonWinner & {
      profile: Pick<Profile, "id" | "username" | "display_name">;
    }
  >;
  seasonSlug?: string; // Reserved for future use with custom medal SVGs
  className?: string;
}

export function Podium({ winners, className }: PodiumProps) {
  // Sort winners: gold, silver, bronze (exclude mvp for podium display)
  const podiumWinners = winners
    .filter((w) => w.medal_type !== "mvp")
    .sort((a, b) => a.final_rank - b.final_rank);

  // Reorder for visual: silver (2nd) - gold (1st) - bronze (3rd)
  const displayOrder = [
    podiumWinners.find((w) => w.medal_type === "silver"),
    podiumWinners.find((w) => w.medal_type === "gold"),
    podiumWinners.find((w) => w.medal_type === "bronze"),
  ].filter(Boolean) as typeof podiumWinners;

  const podiumHeights: Record<MedalType, string> = {
    gold: "h-24 sm:h-32",
    silver: "h-16 sm:h-24",
    bronze: "h-12 sm:h-20",
    mvp: "h-12",
  };

  const podiumColors: Record<MedalType, string> = {
    gold: "bg-yellow-500/20 border-yellow-500/30",
    silver: "bg-slate-300/20 border-slate-300/30",
    bronze: "bg-orange-500/20 border-orange-500/30",
    mvp: "bg-purple-500/20",
  };

  return (
    <div className={cn("flex items-end justify-center gap-2 sm:gap-4", className)}>
      {displayOrder.map((winner) => (
        <div
          key={winner.id}
          className="flex flex-col items-center"
        >
          {/* Player info */}
          <Link
            href={`/player/${winner.profile.id}`}
            className="mb-2 text-center hover:opacity-80 transition-opacity"
          >
            <MedalIcon medalType={winner.medal_type} size="lg" className="mb-1" />
            <p className="font-semibold text-sm sm:text-base truncate max-w-[80px] sm:max-w-[100px]">
              {winner.profile.display_name || winner.profile.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {winner.final_elo} Elo
            </p>
          </Link>

          {/* Podium block */}
          <div
            className={cn(
              "w-20 sm:w-28 rounded-t-lg border-t border-x flex items-center justify-center",
              podiumHeights[winner.medal_type],
              podiumColors[winner.medal_type]
            )}
          >
            <span className="text-2xl sm:text-3xl font-bold opacity-50">
              {winner.final_rank}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// MVP display (separate from podium)
export function MvpDisplay({
  winner,
  className,
}: {
  winner: SeasonWinner & {
    profile: Pick<Profile, "id" | "username" | "display_name">;
  };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg bg-purple-500/10 border border-purple-500/20 p-4",
        className
      )}
    >
      <MedalIcon medalType="mvp" size="lg" />
      <div>
        <p className="text-xs text-purple-400 font-medium">Most Valuable Player</p>
        <Link
          href={`/player/${winner.profile.id}`}
          className="font-semibold hover:opacity-80 transition-opacity"
        >
          {winner.profile.display_name || winner.profile.username}
        </Link>
        <p className="text-xs text-muted-foreground">
          {winner.season_wins} wins
        </p>
      </div>
    </div>
  );
}
