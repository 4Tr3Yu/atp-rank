import { getTierWithDivision } from "@/lib/tiers";
import { TierGem } from "@/components/shared/tier-gem";
import { cn } from "@/lib/utils";

export function TierBadge({
  eloRating,
  showLabel = false,
}: {
  eloRating: number;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
}) {
  const tier = getTierWithDivision(eloRating);

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-medium",
      tier.color,
    )}>
      <TierGem tier={tier} size={24} division={tier.division} />
      <span>
        {showLabel && tier.fullName}
      </span>
    </span>
  );
}
