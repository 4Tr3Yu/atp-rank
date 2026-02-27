export type MatchType = "singles" | "doubles";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  elo_rating: number;
  wins: number;
  losses: number;
  total_wins: number;
  total_losses: number;
  created_at: string;
  updated_at: string;
}

export type MatchStatus = "pending" | "confirmed" | "declined";

export interface Match {
  id: string;
  winner_id: string;
  loser_id: string;
  winner_elo_before: number;
  loser_elo_before: number;
  elo_change: number;
  challenge_id: string | null;
  tournament_match_id: string | null;
  season_id: string | null;
  played_at: string;
  recorded_by: string;
  status: MatchStatus;
  confirmed_at: string | null;
  match_type: MatchType;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  player_id: string;
  team: "winner" | "loser";
  elo_before: number;
  elo_change: number;
}

export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled"
  | "expired";

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: ChallengeStatus;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  match_type: MatchType;
  challenger_partner_id: string | null;
  challenged_partner_id: string | null;
}

export type TournamentStatus =
  | "draft"
  | "open"
  | "in_progress"
  | "completed";

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  status: TournamentStatus;
  max_players: number;
  created_by: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  match_type: MatchType;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string;
  partner_id: string | null;
  seed: number | null;
  eliminated: boolean;
  joined_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  player1_id: string | null;
  player2_id: string | null;
  player1_partner_id: string | null;
  player2_partner_id: string | null;
  winner_id: string | null;
  winner_partner_id: string | null;
  match_id: string | null;
  scheduled_at: string | null;
}

// ============================================
// SEASONS
// ============================================

export type SeasonStatus = "upcoming" | "active" | "completed";

export interface Season {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: SeasonStatus;
  starts_at: string;
  ends_at: string;
  created_at: string;
  created_by: string | null;
}

export interface SeasonTierFinish {
  id: string;
  season_id: string;
  player_id: string;
  final_elo: number;
  awarded_at: string;
}

export type MedalType = "gold" | "silver" | "bronze" | "mvp";

export interface SeasonWinner {
  id: string;
  season_id: string;
  player_id: string;
  medal_type: MedalType;
  final_elo: number;
  season_wins: number;
  season_losses: number;
  final_rank: number;
  awarded_at: string;
}

// ============================================
// TOURNAMENT RESULTS
// ============================================

export interface TournamentResult {
  id: string;
  tournament_id: string;
  player_id: string;
  position_label: string;
  elo_bonus: number;
  awarded_at: string;
}
