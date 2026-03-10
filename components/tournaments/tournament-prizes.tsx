import { Trophy } from "lucide-react";

const prizes = [
  { label: "Champion", bonus: 200, icon: "🥇", minRounds: 1 },
  { label: "Runner-up", bonus: 160, icon: "🥈", minRounds: 1 },
  { label: "Semifinalist", bonus: 125, icon: "🥉", minRounds: 2 },
  { label: "Quarterfinalist", bonus: 110, icon: "4th", minRounds: 3 },
];

export function TournamentPrizes({ maxPlayers }: { maxPlayers: number }) {
  const rounds = Math.ceil(Math.log2(maxPlayers));
  const applicablePrizes = prizes.filter((p) => rounds >= p.minRounds);

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
        <Trophy className="h-4.5 w-4.5 text-primary" />
        Prizes
      </h2>
      <div className="flex flex-wrap gap-2">
        {applicablePrizes.map((prize) => (
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
