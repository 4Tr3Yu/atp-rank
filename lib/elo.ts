export const K_FACTOR = 32;
export const STARTING_RATING = 1200;
export const MINIMUM_RATING = 100;

/**
 * Calculate expected score (probability of winning) for player A against player B.
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate Elo change after a match.
 * Returns a positive integer — winner gains this, loser loses it.
 */
export function calculateEloChange(
  winnerRating: number,
  loserRating: number
): number {
  const expected = expectedScore(winnerRating, loserRating);
  return Math.max(1, Math.round(K_FACTOR * (1 - expected)));
}

/**
 * Apply match result and return new ratings.
 */
export function applyMatchResult(
  winnerRating: number,
  loserRating: number
): {
  newWinnerRating: number;
  newLoserRating: number;
  eloChange: number;
} {
  const eloChange = calculateEloChange(winnerRating, loserRating);
  return {
    newWinnerRating: winnerRating + eloChange,
    newLoserRating: Math.max(MINIMUM_RATING, loserRating - eloChange),
    eloChange,
  };
}
