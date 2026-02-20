import { Badge } from "@/components/ui/badge";
import type { Season, SeasonStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const statusStyles: Record<SeasonStatus, string> = {
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<SeasonStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
};

interface SeasonBadgeProps {
  season: Pick<Season, "name" | "status">;
  showStatus?: boolean;
  className?: string;
}

export function SeasonBadge({
  season,
  showStatus = true,
  className,
}: SeasonBadgeProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Badge variant="outline" className="font-medium">
        {season.name}
      </Badge>
      {showStatus && (
        <Badge variant="outline" className={statusStyles[season.status]}>
          {statusLabels[season.status]}
        </Badge>
      )}
    </div>
  );
}

// Compact version for inline use
export function SeasonTag({
  season,
  className,
}: {
  season: Pick<Season, "name" | "status">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        className
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          season.status === "active" && "bg-green-500",
          season.status === "upcoming" && "bg-blue-500",
          season.status === "completed" && "bg-muted-foreground"
        )}
      />
      <span className="text-muted-foreground">{season.name}</span>
    </span>
  );
}
