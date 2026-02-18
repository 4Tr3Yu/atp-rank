import type { Profile } from "@/lib/types/database";

/**
 * Calculate the number of rounds needed for single elimination.
 */
export function getRoundCount(playerCount: number): number {
  return Math.ceil(Math.log2(playerCount));
}

/**
 * Get the bracket size (next power of 2 >= playerCount).
 */
export function getBracketSize(playerCount: number): number {
  return Math.pow(2, getRoundCount(playerCount));
}

/**
 * Seed players by Elo rating (highest = seed 1).
 * Returns player IDs in seeded order.
 */
export function seedPlayers(players: Pick<Profile, "id" | "elo_rating">[]): string[] {
  return [...players]
    .sort((a, b) => b.elo_rating - a.elo_rating)
    .map((p) => p.id);
}

/**
 * Generate bracket match slots for single elimination.
 * Returns an array of { round, position, player1_id, player2_id }.
 *
 * Standard seeding: 1v(n), 2v(n-1), etc. with byes for non-power-of-2 counts.
 */
export function generateBracket(
  seededPlayerIds: string[]
): { round: number; position: number; player1_id: string | null; player2_id: string | null }[] {
  const n = seededPlayerIds.length;
  const bracketSize = getBracketSize(n);
  const rounds = getRoundCount(n);
  const byeCount = bracketSize - n;
  const matches: { round: number; position: number; player1_id: string | null; player2_id: string | null }[] = [];

  // Build standard seeding order for first round
  // Place seeds so that seed 1 meets seed 2 only in the final
  const firstRoundSlots = buildSeedOrder(bracketSize);

  // Create first round matches
  const firstRoundMatchCount = bracketSize / 2;
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const seed1Index = firstRoundSlots[i * 2];
    const seed2Index = firstRoundSlots[i * 2 + 1];

    const player1 = seed1Index < n ? seededPlayerIds[seed1Index] : null;
    const player2 = seed2Index < n ? seededPlayerIds[seed2Index] : null;

    matches.push({
      round: 1,
      position: i + 1,
      player1_id: player1,
      player2_id: player2,
    });
  }

  // Create placeholder matches for subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round);
    for (let pos = 1; pos <= matchCount; pos++) {
      matches.push({
        round,
        position: pos,
        player1_id: null,
        player2_id: null,
      });
    }
  }

  return matches;
}

/**
 * Build standard tournament seeding order.
 * For a bracket of size 8: [0, 7, 3, 4, 1, 6, 2, 5]
 * This ensures seed 1 (index 0) faces seed 8 (index 7), etc.
 */
function buildSeedOrder(bracketSize: number): number[] {
  let order = [0, 1]; // seeds for 2-player bracket

  while (order.length < bracketSize) {
    const newOrder: number[] = [];
    const size = order.length * 2;
    for (const seed of order) {
      newOrder.push(seed);
      newOrder.push(size - 1 - seed);
    }
    order = newOrder;
  }

  return order;
}

/**
 * Determine which match in the next round a winner advances to.
 */
export function getNextMatch(
  round: number,
  position: number
): { round: number; position: number; slot: "player1_id" | "player2_id" } {
  const nextRound = round + 1;
  const nextPosition = Math.ceil(position / 2);
  const slot = position % 2 === 1 ? "player1_id" : "player2_id";
  return { round: nextRound, position: nextPosition, slot };
}
