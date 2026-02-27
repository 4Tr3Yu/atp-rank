import { MatchCard } from "./match-card";
import type { Match, MatchPlayer, Profile } from "@/lib/types/database";

export function MatchList({
  matches,
  profiles,
  matchPlayersMap,
  layout = "list",
}: {
  matches: Match[];
  profiles: Map<string, Profile>;
  matchPlayersMap?: Map<string, MatchPlayer[]>;
  layout?: "list" | "grid";
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No matches recorded yet.
      </div>
    );
  }

  return (
    <div className={layout === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
      {matches.map((match) => {
        const winner = profiles.get(match.winner_id);
        const loser = profiles.get(match.loser_id);
        if (!winner || !loser) return null;

        const matchPlayers = match.match_type === "doubles"
          ? matchPlayersMap?.get(match.id)
          : undefined;

        return (
          <MatchCard
            key={match.id}
            match={match}
            winner={winner}
            loser={loser}
            matchPlayers={matchPlayers}
            profiles={profiles}
            layout={layout}
          />
        );
      })}
    </div>
  );
}
