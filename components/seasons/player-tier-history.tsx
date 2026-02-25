import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierGem } from "@/components/shared/tier-gem";
import { getTierWithDivision } from "@/lib/tiers";
import type { Season, SeasonTierFinish } from "@/lib/types/database";
import { Gem } from "lucide-react";

interface PlayerTierHistoryProps {
  tierFinishes: Array<
    SeasonTierFinish & {
      season: Pick<Season, "name" | "slug">;
    }
  >;
  className?: string;
}

export function PlayerTierHistory({ tierFinishes, className }: PlayerTierHistoryProps) {
  if (tierFinishes.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gem className="h-4 w-4" />
          Tier History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tierFinishes.map((finish) => {
            const tier = getTierWithDivision(finish.final_elo);
            return (
              <div key={finish.id} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {finish.season.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <TierGem tier={tier} size={14} />
                  <span className={`text-sm font-medium ${tier.color}`}>
                    {tier.fullName}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({finish.final_elo})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
