export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  elo_rating: number;
  wins: number;
  losses: number;
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
  played_at: string;
  recorded_by: string;
  status: MatchStatus;
  confirmed_at: string | null;
}

export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: ChallengeStatus;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  completed_at: string | null;
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
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string;
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
  winner_id: string | null;
  match_id: string | null;
  scheduled_at: string | null;
}
