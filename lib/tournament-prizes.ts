const basePrizes = [
  { label: "Champion", base: 200, icon: "🥇", minRounds: 1 },
  { label: "Runner-up", base: 160, icon: "🥈", minRounds: 1 },
  { label: "Semifinalist", base: 125, icon: "🥉", minRounds: 2 },
  { label: "Quarterfinalist", base: 110, icon: "4th", minRounds: 3 },
];

/** Rounds for a given max_players bracket (4→2, 8→3, 16→4) */
export function getRounds(maxPlayers: number): number {
  return Math.ceil(Math.log2(maxPlayers));
}

/**
 * Scale multiplier: 4 players = 1x, 8 = 1.5x, 16 = 2x
 * Formula: rounds / 2 (minimum 2 rounds for 4 players)
 */
function getMultiplier(maxPlayers: number): number {
  return getRounds(maxPlayers) / 2;
}

export interface Prize {
  label: string;
  bonus: number;
  icon: string;
}

/** Get scaled prizes for a tournament size */
export function getPrizes(maxPlayers: number): Prize[] {
  const rounds = getRounds(maxPlayers);
  const multiplier = getMultiplier(maxPlayers);
  return basePrizes
    .filter((p) => rounds >= p.minRounds)
    .map((p) => ({
      label: p.label,
      icon: p.icon,
      bonus: Math.round((p.base * multiplier) / 5) * 5,
    }));
}

/** Champion prize for a tournament size (used in cards/lists) */
export function getChampionPrize(maxPlayers: number): number {
  return getPrizes(maxPlayers)[0].bonus;
}
