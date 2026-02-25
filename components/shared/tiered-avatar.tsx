import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TierGem } from "@/components/shared/tier-gem";
import { getTierWithDivision } from "@/lib/tiers";

export function TieredAvatar({
  initials,
  seasonFinishElo,
  size = "md",
}: {
  initials: string;
  avatarUrl?: string | null;
  seasonFinishElo?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg font-bold",
  };

  const gemSizes = {
    sm: 10,
    md: 12,
    lg: 16,
  };

  const tier = seasonFinishElo ? getTierWithDivision(seasonFinishElo) : null;

  return (
    <div className="relative inline-flex shrink-0">
      <Avatar
        className={sizeClasses[size]}
        style={
          tier
            ? { boxShadow: `0 0 0 2px ${tier.gemFill}` }
            : undefined
        }
      >
        <AvatarFallback className={`bg-primary/10 text-primary ${textSizes[size]}`}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {tier && (
        <span className="absolute -bottom-0.5 -right-0.5 z-10">
          <TierGem tier={tier} size={gemSizes[size]} />
        </span>
      )}
    </div>
  );
}
