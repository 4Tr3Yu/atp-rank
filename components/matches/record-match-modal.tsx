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
import type { Profile } from "@/lib/types/database";

function EloPreview({
  winner,
  loser,
  change,
}: {
  winner: Profile;
  loser: Profile;
  change: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Elo Preview</p>
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
  const [winnerId, setWinnerId] = useState("");
  const [loserId, setLoserId] = useState("");
  const [pending, setPending] = useState(false);

  const winner = players.find((p) => p.id === winnerId);
  const loser = players.find((p) => p.id === loserId);
  const preview =
    winner && loser
      ? calculateEloChange(winner.elo_rating, loser.elo_rating)
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
        <Label>Winner</Label>
        <PlayerSelect
          players={players}
          value={winnerId}
          onSelect={setWinnerId}
          placeholder="Who won?"
          excludeId={loserId}
        />
      </div>

      <div className="space-y-2">
        <Label>Loser</Label>
        <PlayerSelect
          players={players}
          value={loserId}
          onSelect={setLoserId}
          placeholder="Who lost?"
          excludeId={winnerId}
        />
      </div>

      {preview !== null && winner && loser && (
        <EloPreview winner={winner} loser={loser} change={preview} />
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!winnerId || !loserId || pending}
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
