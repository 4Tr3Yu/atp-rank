export type TierName =
  | "Diamond"
  | "Platinum"
  | "Gold"
  | "Silver"
  | "Bronze"
  | "Plumavit";

export type Tier = {
  name: TierName;
  /** Minimum Elo to reach this tier */
  minElo: number;
  /** Tailwind text color class */
  color: string;
  /** Tailwind bg color class (low opacity, for badges) */
  bgColor: string;
  /** Tailwind border color class */
  borderColor: string;
  /** Emoji icon */
  icon: string;
};

const tiers: Tier[] = [
  {
    name: "Diamond",
    minElo: 1600,
    color: "text-cyan-300",
    bgColor: "bg-cyan-500/15",
    borderColor: "border-cyan-500/30",
    icon: "💎",
  },
  {
    name: "Platinum",
    minElo: 1450,
    color: "text-slate-200",
    bgColor: "bg-slate-300/15",
    borderColor: "border-slate-300/30",
    icon: "⚪",
  },
  {
    name: "Gold",
    minElo: 1300,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/15",
    borderColor: "border-yellow-500/30",
    icon: "🥇",
  },
  {
    name: "Silver",
    minElo: 1150,
    color: "text-gray-400",
    bgColor: "bg-gray-400/15",
    borderColor: "border-gray-400/30",
    icon: "🥈",
  },
  {
    name: "Bronze",
    minElo: 1000,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15",
    borderColor: "border-orange-500/30",
    icon: "🥉",
  },
  {
    name: "Plumavit",
    minElo: 0,
    color: "text-stone-500",
    bgColor: "bg-stone-500/15",
    borderColor: "border-stone-500/30",
    icon: "🧱",
  },
];

/**
 * Get the tier for a given Elo rating.
 */
export function getTier(eloRating: number): Tier {
  for (const tier of tiers) {
    if (eloRating >= tier.minElo) {
      return tier;
    }
  }
  return tiers[tiers.length - 1];
}
