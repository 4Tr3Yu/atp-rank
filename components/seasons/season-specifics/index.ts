import type { ComponentType } from "react";

// Season hero components registry
// Add new seasons here as they are created
const seasonHeroes: Record<string, () => Promise<{ default: ComponentType }>> = {
  "s00-origins": () => import("./s00-origins/hero"),
  "s1-genesis": () => import("./s1-genesis/hero"),
  // Add future seasons here:
  // "s2-name": () => import("./s2-name/hero"),
};

export async function getSeasonHero(
  slug: string
): Promise<ComponentType | null> {
  const loader = seasonHeroes[slug];
  if (!loader) return null;

  try {
    const heroModule = await loader();
    return heroModule.default;
  } catch {
    return null;
  }
}

// Season medal assets registry
// Each season can have custom medal SVGs
export interface SeasonMedalAssets {
  gold: string;
  silver: string;
  bronze: string;
  mvp: string;
}

const seasonMedals: Record<string, SeasonMedalAssets> = {
  "s00-origins": {
    gold: "/seasons/s00-origins/medal-gold.svg",
    silver: "/seasons/s00-origins/medal-silver.svg",
    bronze: "/seasons/s00-origins/medal-bronze.svg",
    mvp: "/seasons/s00-origins/medal-mvp.svg",
  },
  "s1-genesis": {
    gold: "/seasons/s1-genesis/medal-gold.svg",
    silver: "/seasons/s1-genesis/medal-silver.svg",
    bronze: "/seasons/s1-genesis/medal-bronze.svg",
    mvp: "/seasons/s1-genesis/medal-mvp.svg",
  },
  // Add future seasons here
};

// Fallback medal paths (used when season-specific medals aren't available)
const defaultMedals: SeasonMedalAssets = {
  gold: "/medals/default-gold.svg",
  silver: "/medals/default-silver.svg",
  bronze: "/medals/default-bronze.svg",
  mvp: "/medals/default-mvp.svg",
};

export function getSeasonMedals(slug: string): SeasonMedalAssets {
  return seasonMedals[slug] || defaultMedals;
}

// List of all registered season slugs
export function getRegisteredSeasons(): string[] {
  return Object.keys(seasonHeroes);
}
