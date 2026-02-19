import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/shared/tier-badge";
import type { Profile } from "@/lib/types/database";

export function PlayerCard({
  profile,
  rank,
}: {
  profile: Profile;
  rank: number;
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
      <Avatar className="h-16 w-16">
        <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">
            {profile.display_name || profile.username}
          </h2>
          <Badge variant="outline">#{rank}</Badge>
          <TierBadge eloRating={profile.elo_rating} size="sm" />
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
