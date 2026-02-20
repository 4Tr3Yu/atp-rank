import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedalIcon } from "@/components/shared/medal-badge";
import type { MedalType, Season, SeasonWinner } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface PlayerMedalsProps {
  medals: Array<
    SeasonWinner & {
      season: Pick<Season, "name" | "slug">;
    }
  >;
  className?: string;
}

export function PlayerMedals({ medals, className }: PlayerMedalsProps) {
  if (medals.length === 0) {
    return null;
  }

  // Group medals by season
  const medalsBySeason = medals.reduce(
    (acc, medal) => {
      const key = medal.season_id;
      if (!acc[key]) {
        acc[key] = {
          season: medal.season,
          medals: [],
        };
      }
      acc[key].medals.push(medal);
      return acc;
    },
    {} as Record<
      string,
      {
        season: Pick<Season, "name" | "slug">;
        medals: SeasonWinner[];
      }
    >
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          Season Medals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(medalsBySeason).map(([seasonId, { season, medals: seasonMedals }]) => (
            <div key={seasonId} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {season.name}
              </span>
              <div className="flex items-center gap-1">
                {seasonMedals
                  .sort((a, b) => {
                    const order: Record<MedalType, number> = {
                      gold: 0,
                      silver: 1,
                      bronze: 2,
                      mvp: 3,
                    };
                    return order[a.medal_type] - order[b.medal_type];
                  })
                  .map((medal) => (
                    <MedalIcon
                      key={medal.id}
                      medalType={medal.medal_type}
                      size="sm"
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline version for player card
export function PlayerMedalsInline({
  medals,
  className,
}: {
  medals: SeasonWinner[];
  className?: string;
}) {
  if (medals.length === 0) {
    return null;
  }

  // Count medals by type
  const counts: Record<MedalType, number> = {
    gold: 0,
    silver: 0,
    bronze: 0,
    mvp: 0,
  };

  for (const medal of medals) {
    counts[medal.medal_type]++;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {(["gold", "silver", "bronze", "mvp"] as MedalType[]).map((type) =>
        counts[type] > 0 ? (
          <span key={type} className="inline-flex items-center gap-0.5">
            <MedalIcon medalType={type} size="sm" />
            {counts[type] > 1 && (
              <span className="text-xs text-muted-foreground">
                x{counts[type]}
              </span>
            )}
          </span>
        ) : null
      )}
    </div>
  );
}
