"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlayerSelect } from "@/components/shared/player-select";
import { calculateEloChange, calculateDoublesEloChange, MINIMUM_RATING } from "@/lib/elo";
import { useFormAction, useLoading } from "@/lib/loading-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MatchType, Profile } from "@/lib/types/database";

export function RecordMatchForm({
  players,
  currentUserId,
  action,
}: {
  players: Profile[];
  currentUserId: string;
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [matchType, setMatchType] = useState<MatchType>("singles");
  const [opponentId, setOpponentId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [opponent1Id, setOpponent1Id] = useState("");
  const [opponent2Id, setOpponent2Id] = useState("");
  const [didWin, setDidWin] = useState<boolean | null>(null);
  const { isLoading } = useLoading();
  const router = useRouter();

  const wrappedAction = useCallback(
    async (formData: FormData) => {
      const result = await action(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Match recorded! Waiting for opponent confirmation.");
      router.push("/dashboard");
    },
    [action, router]
  );
  const handleSubmit = useFormAction(wrappedAction);

  const currentUser = players.find((p) => p.id === currentUserId);

  // Reset selections when switching mode
  const handleMatchTypeChange = (type: MatchType) => {
    setMatchType(type);
    setOpponentId("");
    setPartnerId("");
    setOpponent1Id("");
    setOpponent2Id("");
    setDidWin(null);
  };

  // Singles logic
  const opponent = players.find((p) => p.id === opponentId);
  const singlesWinnerId = didWin === true ? currentUserId : opponentId;
  const singlesLoserId = didWin === true ? opponentId : currentUserId;
  const singlesWinner = didWin === true ? currentUser : opponent;
  const singlesLoser = didWin === true ? opponent : currentUser;

  const winnerRank = singlesWinner ? players.findIndex((p) => p.id === singlesWinner.id) + 1 : 0;
  const loserRank = singlesLoser ? players.findIndex((p) => p.id === singlesLoser.id) + 1 : 0;
  const totalPlayers = players.length;

  const singlesPreview =
    singlesWinner && singlesLoser && didWin !== null
      ? calculateEloChange(singlesWinner.elo_rating, singlesLoser.elo_rating, {
          winnerRank,
          loserRank,
          totalPlayers,
        }, {
          winnerTotalMatches: singlesWinner.total_wins + singlesWinner.total_losses,
          loserTotalMatches: singlesLoser.total_wins + singlesLoser.total_losses,
        })
      : null;

  // Doubles logic
  const partner = players.find((p) => p.id === partnerId);
  const opp1 = players.find((p) => p.id === opponent1Id);
  const opp2 = players.find((p) => p.id === opponent2Id);

  const doublesWinner1Id = didWin === true ? currentUserId : opponent1Id;
  const doublesWinner2Id = didWin === true ? partnerId : opponent2Id;
  const doublesLoser1Id = didWin === true ? opponent1Id : currentUserId;
  const doublesLoser2Id = didWin === true ? opponent2Id : partnerId;

  const allDoublesSelected = partnerId && opponent1Id && opponent2Id;
  const doublesWinner1 = didWin === true ? currentUser : opp1;
  const doublesWinner2 = didWin === true ? partner : opp2;
  const doublesLoser1 = didWin === true ? opp1 : currentUser;
  const doublesLoser2 = didWin === true ? opp2 : partner;

  const doublesPreview =
    allDoublesSelected && doublesWinner1 && doublesWinner2 && doublesLoser1 && doublesLoser2 && didWin !== null
      ? calculateDoublesEloChange(
          doublesWinner1.elo_rating,
          doublesWinner2.elo_rating,
          doublesLoser1.elo_rating,
          doublesLoser2.elo_rating,
          {
            winner1TotalMatches: doublesWinner1.total_wins + doublesWinner1.total_losses,
            winner2TotalMatches: doublesWinner2.total_wins + doublesWinner2.total_losses,
            loser1TotalMatches: doublesLoser1.total_wins + doublesLoser1.total_losses,
            loser2TotalMatches: doublesLoser2.total_wins + doublesLoser2.total_losses,
          }
        )
      : null;

  // Exclude IDs for doubles player selects
  const selectedIds = [currentUserId, partnerId, opponent1Id, opponent2Id].filter(Boolean);

  const isDoublesReady = matchType === "doubles" && allDoublesSelected && didWin !== null;
  const isSinglesReady = matchType === "singles" && opponentId && didWin !== null;

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Hidden inputs */}
      <input type="hidden" name="match_type" value={matchType} />
      <input type="hidden" name="recorded_by" value={currentUserId} />
      {matchType === "singles" ? (
        <>
          <input type="hidden" name="winner_id" value={singlesWinnerId} />
          <input type="hidden" name="loser_id" value={singlesLoserId} />
        </>
      ) : (
        <>
          <input type="hidden" name="winner1_id" value={doublesWinner1Id} />
          <input type="hidden" name="winner2_id" value={doublesWinner2Id} />
          <input type="hidden" name="loser1_id" value={doublesLoser1Id} />
          <input type="hidden" name="loser2_id" value={doublesLoser2Id} />
        </>
      )}

      {/* Match Type Toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleMatchTypeChange("singles")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all",
            matchType === "singles"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          1v1 Singles
        </button>
        <button
          type="button"
          onClick={() => handleMatchTypeChange("doubles")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all",
            matchType === "doubles"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          2v2 Doubles
        </button>
      </div>

      {matchType === "singles" ? (
        /* Singles Mode */
        <div className="space-y-2">
          <Label>Opponent</Label>
          <PlayerSelect
            players={players}
            value={opponentId}
            onSelect={setOpponentId}
            placeholder="Who did you play against?"
            excludeIds={[currentUserId]}
          />
        </div>
      ) : (
        /* Doubles Mode */
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Your Partner</Label>
            <PlayerSelect
              players={players}
              value={partnerId}
              onSelect={setPartnerId}
              placeholder="Select your partner..."
              excludeIds={selectedIds}
            />
          </div>
          <div className="space-y-2">
            <Label>Opponent 1</Label>
            <PlayerSelect
              players={players}
              value={opponent1Id}
              onSelect={setOpponent1Id}
              placeholder="Select opponent..."
              excludeIds={selectedIds}
            />
          </div>
          <div className="space-y-2">
            <Label>Opponent 2</Label>
            <PlayerSelect
              players={players}
              value={opponent2Id}
              onSelect={setOpponent2Id}
              placeholder="Select opponent..."
              excludeIds={selectedIds}
            />
          </div>
        </div>
      )}

      {/* Result Buttons */}
      <div className="space-y-2">
        <Label>Result</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDidWin(true)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all",
              didWin === true
                ? "border-green-500 bg-green-500/10 text-green-400"
                : "border-border bg-card hover:border-green-500/50"
            )}
          >
            <span className="text-2xl">🏆</span>
            <span className="text-sm font-medium">
              {matchType === "doubles" ? "We Won" : "I Won"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDidWin(false)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all",
              didWin === false
                ? "border-red-500 bg-red-500/10 text-red-400"
                : "border-border bg-card hover:border-red-500/50"
            )}
          >
            <span className="text-2xl">😢</span>
            <span className="text-sm font-medium">
              {matchType === "doubles" ? "We Lost" : "I Lost"}
            </span>
          </button>
        </div>
      </div>

      {/* Elo Preview */}
      {matchType === "singles" && singlesPreview !== null && singlesWinner && singlesLoser && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Elo Preview
            </p>
            <p className="text-xs text-muted-foreground">
              Rank #{winnerRank} vs #{loserRank}
            </p>
          </div>
          <div className="flex justify-between text-sm">
            <span>{singlesWinner.display_name || singlesWinner.username}</span>
            <span className="text-green-400 tabular-nums font-medium">
              {singlesWinner.elo_rating} → {singlesWinner.elo_rating + singlesPreview.winnerGain} (+{singlesPreview.winnerGain})
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{singlesLoser.display_name || singlesLoser.username}</span>
            <span className="text-red-400 tabular-nums font-medium">
              {singlesLoser.elo_rating} → {Math.max(MINIMUM_RATING, singlesLoser.elo_rating - singlesPreview.loserLoss)} (-
              {singlesPreview.loserLoss})
            </span>
          </div>
        </div>
      )}

      {matchType === "doubles" && doublesPreview && doublesWinner1 && doublesWinner2 && doublesLoser1 && doublesLoser2 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Elo Preview (Doubles)
            </p>
            <p className="text-xs text-muted-foreground">
              Team {doublesWinner1.elo_rating + doublesWinner2.elo_rating} vs{" "}
              {doublesLoser1.elo_rating + doublesLoser2.elo_rating}
            </p>
          </div>
          {([
            { player: doublesWinner1, change: doublesPreview.winner1Change },
            { player: doublesWinner2, change: doublesPreview.winner2Change },
          ] as const).map(({ player: p, change }) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span>{p.display_name || p.username}</span>
              <span className="text-green-400 tabular-nums font-medium">
                {p.elo_rating} → {p.elo_rating + change} (+{change})
              </span>
            </div>
          ))}
          {([
            { player: doublesLoser1, change: doublesPreview.loser1Change },
            { player: doublesLoser2, change: doublesPreview.loser2Change },
          ] as const).map(({ player: p, change }) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span>{p.display_name || p.username}</span>
              <span className="text-red-400 tabular-nums font-medium">
                {p.elo_rating} → {Math.max(MINIMUM_RATING, p.elo_rating - change)} (-
                {change})
              </span>
            </div>
          ))}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!(isSinglesReady || isDoublesReady) || isLoading}
      >
        {isLoading ? "Recording..." : "Record Match"}
      </Button>
    </form>
  );
}
