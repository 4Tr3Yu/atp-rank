import { Card, CardContent } from "@/components/ui/card";
import type { Profile, Match } from "@/lib/types/database";

function calculateStreak(matches: Match[], playerId: string): string {
  let streak = 0;
  let type: "W" | "L" | null = null;

  for (const match of matches) {
    const won = match.winner_id === playerId;
    if (type === null) {
      type = won ? "W" : "L";
      streak = 1;
    } else if ((won && type === "W") || (!won && type === "L")) {
      streak++;
    } else {
      break;
    }
  }

  if (!type) return "-";
  return `${streak}${type}`;
}

export function StatsGrid({
  profile,
  matches,
}: {
  profile: Profile;
  matches: Match[];
}) {
  const totalMatches = profile.wins + profile.losses;
  const winRate = totalMatches > 0
    ? Math.round((profile.wins / totalMatches) * 100)
    : 0;
  const streak = calculateStreak(matches, profile.id);

  // Calculate best/worst Elo from match history
  let bestElo = profile.elo_rating;
  let worstElo = profile.elo_rating;
  let currentElo = 1200; // starting

  // Rebuild Elo history from matches (oldest to newest)
  const sortedMatches = [...matches].reverse();
  for (const match of sortedMatches) {
    if (match.winner_id === profile.id) {
      currentElo = match.winner_elo_before + match.elo_change;
    } else {
      currentElo = Math.max(100, match.loser_elo_before - match.elo_change);
    }
    bestElo = Math.max(bestElo, currentElo);
    worstElo = Math.min(worstElo, currentElo);
  }

  const stats = [
    { label: "Matches", value: totalMatches.toString() },
    { label: "Win Rate", value: `${winRate}%` },
    { label: "Streak", value: streak },
    { label: "Best Elo", value: bestElo.toString() },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
