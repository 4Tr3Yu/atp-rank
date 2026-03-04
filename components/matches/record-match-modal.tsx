"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useFormAction, useLoading } from "@/lib/loading-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { PlayerSelect } from "@/components/shared/player-select";
import { calculateEloChange, calculateDoublesEloChange, MINIMUM_RATING } from "@/lib/elo";
import { cn } from "@/lib/utils";
import type { MatchType, Profile } from "@/lib/types/database";

function EloPreview({
  winner,
  loser,
  winnerGain,
  loserLoss,
  winnerRank,
  loserRank,
}: {
  winner: Profile;
  loser: Profile;
  winnerGain: number;
  loserLoss: number;
  winnerRank: number;
  loserRank: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Elo Preview</p>
        <p className="text-xs text-muted-foreground">
          Rank #{winnerRank} vs #{loserRank}
        </p>
      </div>
      <div className="flex justify-between text-sm">
        <span>{winner.display_name || winner.username}</span>
        <span className="text-green-400 tabular-nums font-medium">
          {winner.elo_rating} → {winner.elo_rating + winnerGain} (+{winnerGain})
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span>{loser.display_name || loser.username}</span>
        <span className="text-red-400 tabular-nums font-medium">
          {loser.elo_rating} → {Math.max(MINIMUM_RATING, loser.elo_rating - loserLoss)} (-
          {loserLoss})
        </span>
      </div>
    </div>
  );
}

function DoublesEloPreview({
  winners,
  losers,
  winnerChanges,
  loserChanges,
  teamWinnerElo,
  teamLoserElo,
}: {
  winners: Profile[];
  losers: Profile[];
  winnerChanges: number[];
  loserChanges: number[];
  teamWinnerElo: number;
  teamLoserElo: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Elo Preview (Doubles)</p>
        <p className="text-xs text-muted-foreground">
          Team {teamWinnerElo} vs {teamLoserElo}
        </p>
      </div>
      {winners.map((p, i) => (
        <div key={p.id} className="flex justify-between text-sm">
          <span>{p.display_name || p.username}</span>
          <span className="text-green-400 tabular-nums font-medium">
            {p.elo_rating} → {p.elo_rating + winnerChanges[i]} (+{winnerChanges[i]})
          </span>
        </div>
      ))}
      {losers.map((p, i) => (
        <div key={p.id} className="flex justify-between text-sm">
          <span>{p.display_name || p.username}</span>
          <span className="text-red-400 tabular-nums font-medium">
            {p.elo_rating} → {Math.max(MINIMUM_RATING, p.elo_rating - loserChanges[i])} (-
            {loserChanges[i]})
          </span>
        </div>
      ))}
    </div>
  );
}

function RecordMatchContent({
  players,
  currentUserId,
  action,
  onSuccess,
}: {
  players: Profile[];
  currentUserId: string;
  action: (formData: FormData) => Promise<{ error?: string }>;
  onSuccess: () => void;
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
      onSuccess();
      router.push("/dashboard");
    },
    [action, onSuccess, router]
  );
  const handleSubmit = useFormAction(wrappedAction);

  const currentUser = players.find((p) => p.id === currentUserId);

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

  const selectedIds = [currentUserId, partnerId, opponent1Id, opponent2Id].filter(Boolean);
  const isDoublesReady = matchType === "doubles" && allDoublesSelected && didWin !== null;
  const isSinglesReady = matchType === "singles" && opponentId && didWin !== null;

  return (
    <form action={handleSubmit} className="space-y-5 pt-2">
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

      {matchType === "singles" && singlesPreview !== null && singlesWinner && singlesLoser && (
        <EloPreview
          winner={singlesWinner}
          loser={singlesLoser}
          winnerGain={singlesPreview.winnerGain}
          loserLoss={singlesPreview.loserLoss}
          winnerRank={winnerRank}
          loserRank={loserRank}
        />
      )}

      {matchType === "doubles" && doublesPreview && doublesWinner1 && doublesWinner2 && doublesLoser1 && doublesLoser2 && (
        <DoublesEloPreview
          winners={[doublesWinner1, doublesWinner2]}
          losers={[doublesLoser1, doublesLoser2]}
          winnerChanges={[doublesPreview.winner1Change, doublesPreview.winner2Change]}
          loserChanges={[doublesPreview.loser1Change, doublesPreview.loser2Change]}
          teamWinnerElo={doublesWinner1.elo_rating + doublesWinner2.elo_rating}
          teamLoserElo={doublesLoser1.elo_rating + doublesLoser2.elo_rating}
        />
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

export function RecordMatchModal({
  players,
  currentUserId,
  action,
  children,
}: {
  players: Profile[];
  currentUserId: string;
  action: (formData: FormData) => Promise<{ error?: string }>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Match</DialogTitle>
            <DialogDescription>
              Log a match result to update rankings
            </DialogDescription>
          </DialogHeader>
          <RecordMatchContent
            players={players}
            currentUserId={currentUserId}
            action={action}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle>Record Match</SheetTitle>
          <SheetDescription>
            Log a match result to update rankings
          </SheetDescription>
        </SheetHeader>
        <RecordMatchContent
          players={players}
          currentUserId={currentUserId}
          action={action}
          onSuccess={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
