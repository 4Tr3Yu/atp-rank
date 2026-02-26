import { AwaitingConfirmationCard } from "./awaiting-confirmation-card";
import type { Match, Profile } from "@/lib/types/database";

export function AwaitingConfirmationList({
  matches,
  profiles,
  currentUserId,
}: {
  matches: Match[];
  profiles: Map<string, Profile>;
  currentUserId: string;
}) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const winner = profiles.get(match.winner_id);
        const loser = profiles.get(match.loser_id);
        if (!winner || !loser) return null;

        return (
          <AwaitingConfirmationCard
            key={match.id}
            match={match}
            winner={winner}
            loser={loser}
            currentUserId={currentUserId}
          />
        );
      })}
    </div>
  );
}
