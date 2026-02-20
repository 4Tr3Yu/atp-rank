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
  // Season stats
  const seasonMatches = profile.wins + profile.losses;
  const seasonWinRate = seasonMatches > 0
    ? Math.round((profile.wins / seasonMatches) * 100)
    : 0;

  // All-time stats
  const totalWins = profile.total_wins ?? profile.wins;
  const totalLosses = profile.total_losses ?? profile.losses;
  const allTimeMatches = totalWins + totalLosses;
  const allTimeWinRate = allTimeMatches > 0
    ? Math.round((totalWins / allTimeMatches) * 100)
    : 0;

  const streak = calculateStreak(matches, profile.id);

  // Calculate best Elo from match history
  let bestElo = profile.elo_rating;
  let currentElo = 1200;

  const sortedMatches = [...matches].reverse();
  for (const match of sortedMatches) {
    if (match.winner_id === profile.id) {
      currentElo = match.winner_elo_before + match.elo_change;
    } else {
      currentElo = Math.max(100, match.loser_elo_before - match.elo_change);
    }
    bestElo = Math.max(bestElo, currentElo);
  }

  const stats = [
    {
      label: "Record",
      value: `${profile.wins}-${profile.losses}`,
      subtext: `All-time: ${totalWins}-${totalLosses}`,
    },
    {
      label: "Win Rate",
      value: `${seasonWinRate}%`,
      subtext: `All-time: ${allTimeWinRate}%`,
    },
    {
      label: "Streak",
      value: streak,
      subtext: `${seasonMatches} games`,
    },
    {
      label: "Best Elo",
      value: bestElo.toString(),
      subtext: `Current: ${profile.elo_rating}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            {stat.subtext && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {stat.subtext}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
