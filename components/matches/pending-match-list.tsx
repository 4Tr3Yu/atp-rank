import { PendingMatchCard } from "./pending-match-card";
import type { Match, Profile } from "@/lib/types/database";

export function PendingMatchList({
  matches,
  profiles,
  currentUserId,
  confirmAction,
  declineAction,
}: {
  matches: Match[];
  profiles: Map<string, Profile>;
  currentUserId: string;
  confirmAction: (formData: FormData) => Promise<void>;
  declineAction: (formData: FormData) => Promise<void>;
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No pending matches to confirm.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const winner = profiles.get(match.winner_id);
        const loser = profiles.get(match.loser_id);
        const recorder = profiles.get(match.recorded_by);
        if (!winner || !loser || !recorder) return null;

        return (
          <PendingMatchCard
            key={match.id}
            match={match}
            winner={winner}
            loser={loser}
            recorder={recorder}
            currentUserId={currentUserId}
            confirmAction={confirmAction}
            declineAction={declineAction}
          />
        );
      })}
    </div>
  );
}
