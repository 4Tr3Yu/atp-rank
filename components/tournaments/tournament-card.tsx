import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { Tournament } from "@/lib/types/database";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-muted text-muted-foreground border-border",
};

export function TournamentCard({
  tournament,
  participantCount,
}: {
  tournament: Tournament;
  participantCount: number;
}) {
  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card className="transition-colors hover:border-primary/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold leading-tight">{tournament.name}</h3>
            <Badge
              variant="outline"
              className={statusColors[tournament.status]}
            >
              {tournament.status.replace("_", " ")}
            </Badge>
          </div>
          {tournament.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {tournament.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="tabular-nums">
              {participantCount} / {tournament.max_players}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
