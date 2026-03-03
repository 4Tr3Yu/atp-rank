import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/shared/tier-badge";
import { TieredAvatar } from "@/components/shared/tiered-avatar";
import type { Profile } from "@/lib/types/database";

export function PlayerCard({
  profile,
  rank,
  seasonFinishElo,
}: {
  profile: Profile;
  rank: number | null;
  seasonFinishElo?: number;
}) {
  const initials = (profile.display_name || profile.username)
    .slice(0, 2)
    .toUpperCase();
  const totalMatches = profile.wins + profile.losses;
  const winRate = totalMatches > 0
    ? Math.round((profile.wins / totalMatches) * 100)
    : 0;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6">
      <TieredAvatar
        initials={initials}
        seasonFinishElo={seasonFinishElo}
        size="lg"
      />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">
            {profile.display_name || profile.username}
          </h2>
          <Badge variant="outline">{rank !== null ? `#${rank}` : "Unranked"}</Badge>
          <TierBadge eloRating={profile.elo_rating} showLabel />
        </div>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold text-primary tabular-nums">
            {profile.elo_rating} Elo
          </span>
          <span className="tabular-nums">
            <span className="text-green-400">{profile.wins}W</span>
            {" / "}
            <span className="text-red-400">{profile.losses}L</span>
          </span>
          <span className="text-muted-foreground tabular-nums">
            {winRate}% win rate
          </span>
        </div>
      </div>
    </div>
  );
}
