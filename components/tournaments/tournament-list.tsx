import { TournamentCard } from "./tournament-card";
import type { Tournament } from "@/lib/types/database";

export function TournamentList({
  tournaments,
  participantCounts,
}: {
  tournaments: Tournament[];
  participantCounts: Map<string, number>;
}) {
  if (tournaments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No tournaments yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tournaments.map((tournament) => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          participantCount={participantCounts.get(tournament.id) || 0}
        />
      ))}
    </div>
  );
}
