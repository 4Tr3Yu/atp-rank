export type TierName =
  | "RIA Chief"
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
  /** Primary fill color for the gem SVG */
  gemFill: string;
  /** Lighter highlight color for the gem facets */
  gemHighlight: string;
  /** Darker shadow color for the gem facets */
  gemShadow: string;
};

const tiers: Tier[] = [
  {
    name: "RIA Chief",
    minElo: 1800,
    color: "text-cyan-300",
    bgColor: "bg-cyan-500/15",
    borderColor: "border-cyan-500/30",
    gemFill: "#67e8f9",
    gemHighlight: "#a5f3fc",
    gemShadow: "#06b6d4",
  },
  {
    name: "Platinum",
    minElo: 1650,
    color: "text-slate-200",
    bgColor: "bg-slate-300/15",
    borderColor: "border-slate-300/30",
    gemFill: "#cbd5e1",
    gemHighlight: "#e2e8f0",
    gemShadow: "#94a3b8",
  },
  {
    name: "Gold",
    minElo: 1500,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/15",
    borderColor: "border-yellow-500/30",
    gemFill: "#facc15",
    gemHighlight: "#fde68a",
    gemShadow: "#ca8a04",
  },
  {
    name: "Silver",
    minElo: 1350,
    color: "text-gray-400",
    bgColor: "bg-gray-400/15",
    borderColor: "border-gray-400/30",
    gemFill: "#9ca3af",
    gemHighlight: "#d1d5db",
    gemShadow: "#6b7280",
  },
  {
    name: "Bronze",
    minElo: 1200,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15",
    borderColor: "border-orange-500/30",
    gemFill: "#fb923c",
    gemHighlight: "#fdba74",
    gemShadow: "#c2410c",
  },
  {
    name: "Plumavit",
    minElo: 0,
    color: "text-stone-500",
    bgColor: "bg-stone-500/15",
    borderColor: "border-stone-500/30",
    gemFill: "#78716c",
    gemHighlight: "#a8a29e",
    gemShadow: "#57534e",
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
