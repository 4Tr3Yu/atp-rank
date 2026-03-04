export const K_FACTOR = 32;
export const STARTING_RATING = 1200;
export const MINIMUM_RATING = 100;

// Rank-weighted K-factor constants
export const RANK_SCALE = 0.5;
export const K_MIN_MULTIPLIER = 0.5;
export const K_MAX_MULTIPLIER = 1.5;

// Experience-based K-factor constants
export const K_EXP_MIN = 0.6;
export const K_EXP_MAX = 1.4;
export const K_EXP_SCALE = 30;

export type RankInfo = {
  winnerRank: number;
  loserRank: number;
  totalPlayers: number;
};

export type ExperienceInfo = {
  winnerTotalMatches: number;
  loserTotalMatches: number;
};

export type DoublesExperienceInfo = {
  winner1TotalMatches: number;
  winner2TotalMatches: number;
  loser1TotalMatches: number;
  loser2TotalMatches: number;
};

/**
 * Calculate expected score (probability of winning) for player A against player B.
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate the K-factor multiplier based on rank positions.
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
 * Calculate experience multiplier based on total all-time matches.
 * More games → higher multiplier (veteran, max stake).
 * Fewer games → lower multiplier (newbie, protected).
 */
export function calculateExpMultiplier(totalMatches: number): number {
  return Math.min(K_EXP_MAX, K_EXP_MIN + totalMatches / K_EXP_SCALE);
}

/**
 * Calculate Elo change after a match.
 * Returns asymmetric changes — winner gain and loser loss may differ
 * when experience info is provided.
 */
export function calculateEloChange(
  winnerRating: number,
  loserRating: number,
  rankInfo?: RankInfo,
  experienceInfo?: ExperienceInfo
): { winnerGain: number; loserLoss: number } {
  const expected = expectedScore(winnerRating, loserRating);
  const multiplier = rankInfo
    ? calculateRankMultiplier(
        rankInfo.winnerRank,
        rankInfo.loserRank,
        rankInfo.totalPlayers
      )
    : 1;
  const adjustedK = K_FACTOR * multiplier;
  const baseChange = Math.max(1, Math.round(adjustedK * (1 - expected)));

  if (experienceInfo) {
    const winnerExp = calculateExpMultiplier(experienceInfo.winnerTotalMatches);
    const loserExp = calculateExpMultiplier(experienceInfo.loserTotalMatches);
    return {
      winnerGain: Math.max(1, Math.round(baseChange * winnerExp)),
      loserLoss: Math.max(1, Math.round(baseChange * loserExp)),
    };
  }

  return { winnerGain: baseChange, loserLoss: baseChange };
}

/**
 * Calculate Elo change for a doubles match.
 * Team Elo = sum of individual Elos. Flat K=32 (no rank-weighting).
 * Returns per-player changes (experience-scaled when info provided).
 */
export function calculateDoublesEloChange(
  winner1Rating: number,
  winner2Rating: number,
  loser1Rating: number,
  loser2Rating: number,
  experienceInfo?: DoublesExperienceInfo
): {
  teamChange: number;
  winner1Change: number;
  winner2Change: number;
  loser1Change: number;
  loser2Change: number;
} {
  const teamWinnerElo = winner1Rating + winner2Rating;
  const teamLoserElo = loser1Rating + loser2Rating;
  const expected = expectedScore(teamWinnerElo, teamLoserElo);
  const teamChange = Math.max(1, Math.round(K_FACTOR * (1 - expected)));
  const playerChange = Math.max(1, Math.round(teamChange / 2));

  if (experienceInfo) {
    const w1Exp = calculateExpMultiplier(experienceInfo.winner1TotalMatches);
    const w2Exp = calculateExpMultiplier(experienceInfo.winner2TotalMatches);
    const l1Exp = calculateExpMultiplier(experienceInfo.loser1TotalMatches);
    const l2Exp = calculateExpMultiplier(experienceInfo.loser2TotalMatches);
    return {
      teamChange,
      winner1Change: Math.max(1, Math.round(playerChange * w1Exp)),
      winner2Change: Math.max(1, Math.round(playerChange * w2Exp)),
      loser1Change: Math.max(1, Math.round(playerChange * l1Exp)),
      loser2Change: Math.max(1, Math.round(playerChange * l2Exp)),
    };
  }

  return {
    teamChange,
    winner1Change: playerChange,
    winner2Change: playerChange,
    loser1Change: playerChange,
    loser2Change: playerChange,
  };
}

/**
 * Apply match result and return new ratings.
 */
export function applyMatchResult(
  winnerRating: number,
  loserRating: number,
  rankInfo?: RankInfo,
  experienceInfo?: ExperienceInfo
): {
  newWinnerRating: number;
  newLoserRating: number;
  winnerGain: number;
  loserLoss: number;
} {
  const { winnerGain, loserLoss } = calculateEloChange(
    winnerRating,
    loserRating,
    rankInfo,
    experienceInfo
  );
  return {
    newWinnerRating: winnerRating + winnerGain,
    newLoserRating: Math.max(MINIMUM_RATING, loserRating - loserLoss),
    winnerGain,
    loserLoss,
  };
}
