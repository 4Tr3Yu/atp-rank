export const K_FACTOR = 32;
export const STARTING_RATING = 1200;
export const MINIMUM_RATING = 100;

// Rank-weighted K-factor constants
export const RANK_SCALE = 0.5;
export const K_MIN_MULTIPLIER = 0.5;
export const K_MAX_MULTIPLIER = 1.5;

export type RankInfo = {
  winnerRank: number;
  loserRank: number;
  totalPlayers: number;
};

/**
 * Calculate expected score (probability of winning) for player A against player B.
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate the K-factor multiplier based on rank positions.
 *
 * When the higher-ranked player wins (expected), multiplier < 1 (less Elo exchanged).
 * When the lower-ranked player wins (upset), multiplier > 1 (more Elo exchanged).
 * When adjacent ranks play, multiplier ~ 1 (normal Elo exchange).
 */
export function calculateRankMultiplier(
  winnerRank: number,
  loserRank: number,
  totalPlayers: number
): number {
  if (totalPlayers <= 1) return 1;
  const rankDifference = winnerRank - loserRank;
  const rawFactor = 1 + (rankDifference / totalPlayers) * RANK_SCALE;
  return Math.min(K_MAX_MULTIPLIER, Math.max(K_MIN_MULTIPLIER, rawFactor));
}

/**
 * Calculate Elo change after a match.
 * Returns a positive integer — winner gains this, loser loses it.
 * If rankInfo is provided, K-factor is scaled by rank proximity.
 */
export function calculateEloChange(
  winnerRating: number,
  loserRating: number,
  rankInfo?: RankInfo
): number {
  const expected = expectedScore(winnerRating, loserRating);
  const multiplier = rankInfo
    ? calculateRankMultiplier(
        rankInfo.winnerRank,
        rankInfo.loserRank,
        rankInfo.totalPlayers
      )
    : 1;
  const adjustedK = K_FACTOR * multiplier;
  return Math.max(1, Math.round(adjustedK * (1 - expected)));
}

/**
 * Apply match result and return new ratings.
 */
export function applyMatchResult(
  winnerRating: number,
  loserRating: number,
  rankInfo?: RankInfo
): {
  newWinnerRating: number;
  newLoserRating: number;
  eloChange: number;
} {
  const eloChange = calculateEloChange(winnerRating, loserRating, rankInfo);
  return {
    newWinnerRating: winnerRating + eloChange,
    newLoserRating: Math.max(MINIMUM_RATING, loserRating - eloChange),
    eloChange,
  };
}
