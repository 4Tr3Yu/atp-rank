import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Podium, MvpDisplay } from "./podium";
import type { Profile, Season, SeasonWinner } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type WinnerWithProfile = SeasonWinner & {
  profile: Pick<Profile, "id" | "username" | "display_name">;
};

interface HallOfFameCardProps {
  season: Season;
  winners: WinnerWithProfile[];
  className?: string;
}

export function HallOfFameCard({
  season,
  winners,
  className,
}: HallOfFameCardProps) {
  const podiumWinners = winners.filter((w) => w.medal_type !== "mvp");
  const mvpWinner = winners.find((w) => w.medal_type === "mvp");

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{season.name}</CardTitle>
            {season.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {season.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Podium */}
        {podiumWinners.length > 0 && (
          <Podium winners={podiumWinners} seasonSlug={season.slug} />
        )}

        {/* MVP */}
        {mvpWinner && <MvpDisplay winner={mvpWinner} />}

        {/* Season stats summary */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2 border-t">
          <div className="text-center">
            <p className="font-semibold text-foreground">
              {new Date(season.starts_at).toLocaleDateString()}
            </p>
            <p className="text-xs">Started</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="font-semibold text-foreground">
              {new Date(season.ends_at).toLocaleDateString()}
            </p>
            <p className="text-xs">Ended</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
