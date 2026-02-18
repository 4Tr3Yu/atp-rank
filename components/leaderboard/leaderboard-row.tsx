import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RankBadge } from "./rank-badge";
import type { Profile } from "@/lib/types/database";

export function LeaderboardRow({
  profile,
  rank,
}: {
  profile: Profile;
  rank: number;
}) {
  const totalMatches = profile.wins + profile.losses;
  const winRate = totalMatches > 0
    ? Math.round((profile.wins / totalMatches) * 100)
    : 0;
  const initials = (profile.display_name || profile.username)
    .slice(0, 2)
    .toUpperCase();

  return (
    <TableRow>
      <TableCell className="w-16 text-center">
        <RankBadge rank={rank} />
      </TableCell>
      <TableCell>
        <Link
          href={`/player/${profile.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium leading-none">
              {profile.display_name || profile.username}
            </p>
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
          </div>
        </Link>
      </TableCell>
      <TableCell className="text-right font-bold text-primary tabular-nums">
        {profile.elo_rating}
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
