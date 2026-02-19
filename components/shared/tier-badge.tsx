import { getTier } from "@/lib/tiers";
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
  const tier = getTier(eloRating);

  const gemSizes = {
    xs: 10,
    sm: 14,
    md: 24,
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-medium",
      tier.color,
    )}>
      <TierGem tier={tier} size={gemSizes['md']} />
      <span>
        {showLabel && tier.name}
      </span>
    </span>
  );
}
