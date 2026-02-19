import { getTier } from "@/lib/tiers";
import { cn } from "@/lib/utils";

export function TierBadge({
  eloRating,
  size = "sm",
  showLabel = true,
}: {
  eloRating: number;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
}) {
  const tier = getTier(eloRating);

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0 gap-0.5",
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
  };

  const iconSizes = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        tier.bgColor,
        tier.borderColor,
        tier.color,
        sizeClasses[size]
      )}
    >
      <span className={iconSizes[size]}>{tier.icon}</span>
      {showLabel && tier.name}
    </span>
  );
}
