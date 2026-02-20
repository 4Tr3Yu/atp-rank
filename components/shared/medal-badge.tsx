import Image from "next/image";
import { getSeasonMedals } from "@/components/seasons/season-specifics";
import type { MedalType } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const medalLabels: Record<MedalType, string> = {
  gold: "1st Place",
  silver: "2nd Place",
  bronze: "3rd Place",
  mvp: "MVP",
};

const medalColors: Record<MedalType, string> = {
  gold: "text-yellow-400",
  silver: "text-slate-300",
  bronze: "text-orange-400",
  mvp: "text-purple-400",
};

const sizeClasses = {
  sm: { container: "h-6 w-6", text: "text-xs" },
  md: { container: "h-8 w-8", text: "text-sm" },
  lg: { container: "h-12 w-12", text: "text-base" },
};

interface MedalBadgeProps {
  seasonSlug: string;
  medalType: MedalType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function MedalBadge({
  seasonSlug,
  medalType,
  size = "md",
  showLabel = false,
  className,
}: MedalBadgeProps) {
  const medals = getSeasonMedals(seasonSlug);
  const medalSrc = medals[medalType];
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        medalColors[medalType],
        className
      )}
    >
      <span className={cn("relative", sizeClass.container)}>
        <Image
          src={medalSrc}
          alt={medalLabels[medalType]}
          fill
          className="object-contain"
        />
      </span>
      {showLabel && (
        <span className={cn("font-medium", sizeClass.text)}>
          {medalLabels[medalType]}
        </span>
      )}
    </span>
  );
}

// Fallback medal icon when SVG is not available
export function MedalIcon({
  medalType,
  size = "md",
  className,
}: {
  medalType: MedalType;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = sizeClasses[size];
  const bgColors: Record<MedalType, string> = {
    gold: "bg-yellow-500/20 border-yellow-500/30",
    silver: "bg-slate-300/20 border-slate-300/30",
    bronze: "bg-orange-500/20 border-orange-500/30",
    mvp: "bg-purple-500/20 border-purple-500/30",
  };

  const labels: Record<MedalType, string> = {
    gold: "1",
    silver: "2",
    bronze: "3",
    mvp: "M",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-bold",
        sizeClass.container,
        sizeClass.text,
        bgColors[medalType],
        medalColors[medalType],
        className
      )}
    >
      {labels[medalType]}
    </span>
  );
}
