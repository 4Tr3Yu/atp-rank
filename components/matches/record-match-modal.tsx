"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
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
import { calculateEloChange } from "@/lib/elo";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

function EloPreview({
  winner,
  loser,
  change,
  winnerRank,
  loserRank,
}: {
  winner: Profile;
  loser: Profile;
  change: number;
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
          {winner.elo_rating} → {winner.elo_rating + change} (+{change})
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span>{loser.display_name || loser.username}</span>
        <span className="text-red-400 tabular-nums font-medium">
          {loser.elo_rating} → {Math.max(100, loser.elo_rating - change)} (-
          {change})
        </span>
      </div>
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
  action: (formData: FormData) => Promise<void>;
  onSuccess: () => void;
}) {
  const [opponentId, setOpponentId] = useState("");
  const [didWin, setDidWin] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  const currentUser = players.find((p) => p.id === currentUserId);
  const opponent = players.find((p) => p.id === opponentId);

  // Calculate winner/loser based on result
  const winnerId = didWin === true ? currentUserId : opponentId;
  const loserId = didWin === true ? opponentId : currentUserId;
  const winner = didWin === true ? currentUser : opponent;
  const loser = didWin === true ? opponent : currentUser;

  // Derive ranks from sorted players array (already sorted by elo_rating DESC)
  const winnerRank = winner
    ? players.findIndex((p) => p.id === winner.id) + 1
    : 0;
  const loserRank = loser
    ? players.findIndex((p) => p.id === loser.id) + 1
    : 0;
  const totalPlayers = players.length;

  const preview =
    winner && loser && didWin !== null
      ? calculateEloChange(winner.elo_rating, loser.elo_rating, {
          winnerRank,
          loserRank,
          totalPlayers,
        })
      : null;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await action(formData);
      onSuccess();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5 pt-2">
      <input type="hidden" name="winner_id" value={winnerId} />
      <input type="hidden" name="loser_id" value={loserId} />
      <input type="hidden" name="recorded_by" value={currentUserId} />

      <div className="space-y-2">
        <Label>Opponent</Label>
        <PlayerSelect
          players={players}
          value={opponentId}
          onSelect={setOpponentId}
          placeholder="Who did you play against?"
          excludeId={currentUserId}
        />
      </div>

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
            <span className="text-sm font-medium">I Won</span>
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
            <span className="text-sm font-medium">I Lost</span>
          </button>
        </div>
      </div>

      {preview !== null && winner && loser && (
        <EloPreview winner={winner} loser={loser} change={preview} winnerRank={winnerRank} loserRank={loserRank} />
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!opponentId || didWin === null || pending}
      >
        {pending ? "Recording..." : "Record Match"}
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
  action: (formData: FormData) => Promise<void>;
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
