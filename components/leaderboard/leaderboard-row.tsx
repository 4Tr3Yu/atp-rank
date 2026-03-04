import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { RankBadge } from "./rank-badge";
import { TieredAvatar } from "@/components/shared/tiered-avatar";
import { TierBadge } from "@/components/shared/tier-badge";
import type { Profile } from "@/lib/types/database";

export function LeaderboardRow({
  profile,
  rank,
  seasonFinishElo,
}: {
  profile: Profile;
  rank: number | null;
  seasonFinishElo?: number;
}) {
  const totalMatches = profile.wins + profile.losses;
  const winRate = totalMatches > 0
    ? Math.round((profile.wins / totalMatches) * 100)
    : 0;
  const initials = (profile.display_name || profile.username)
    .slice(0, 2)
    .toUpperCase();

  return (
    <TableRow className="relative overflow-visible">
      <TableCell className="w-16 text-center">
        <RankBadge rank={rank} />
      </TableCell>
      <TableCell>
        <Link
          href={`/player/${profile.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <TieredAvatar
            initials={initials}
            seasonFinishElo={seasonFinishElo}
            size="sm"
          />

          <div>
            <p className="font-medium leading-none">
              {profile.display_name || profile.username}
            </p>
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
          </div>
        </Link>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="font-bold text-primary tabular-nums">{profile.elo_rating}</span>
          <TierBadge eloRating={profile.elo_rating} />
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <span className="text-green-400">{profile.wins}W</span>
        {" / "}
        <span className="text-red-400">{profile.losses}L</span>
      </TableCell>
      <TableCell className="text-right text-muted-foreground tabular-nums">
        {winRate}%
      </TableCell>
    </TableRow>
  );
}
