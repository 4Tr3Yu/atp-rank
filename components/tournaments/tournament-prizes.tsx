import { Trophy } from "lucide-react";
import { getPrizes } from "@/lib/tournament-prizes";

export function TournamentPrizes({ maxPlayers }: { maxPlayers: number }) {
  const prizes = getPrizes(maxPlayers);

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
        <Trophy className="h-4.5 w-4.5 text-primary" />
        Prizes
      </h2>
      <div className="flex flex-wrap gap-2">
        {prizes.map((prize) => (
          <div
            key={prize.label}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
          >
            <span className="text-sm">{prize.icon}</span>
            <span className="text-sm font-medium">{prize.label}</span>
            <span className="text-sm font-semibold text-green-400">
              +{prize.bonus}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
