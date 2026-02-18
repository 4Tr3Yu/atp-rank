"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlayerSelect } from "@/components/shared/player-select";
import { calculateEloChange } from "@/lib/elo";
import type { Profile } from "@/lib/types/database";

export function RecordMatchForm({
  players,
  currentUserId,
  action,
}: {
  players: Profile[];
  currentUserId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [winnerId, setWinnerId] = useState("");
  const [loserId, setLoserId] = useState("");

  const winner = players.find((p) => p.id === winnerId);
  const loser = players.find((p) => p.id === loserId);

  const preview =
    winner && loser
      ? calculateEloChange(winner.elo_rating, loser.elo_rating)
      : null;

  return (
    <form action={action} className="space-y-6">
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
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Elo Preview
          </p>
          <div className="flex justify-between text-sm">
            <span>{winner.display_name || winner.username}</span>
            <span className="text-green-400 tabular-nums font-medium">
              {winner.elo_rating} → {winner.elo_rating + preview} (+{preview})
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{loser.display_name || loser.username}</span>
            <span className="text-red-400 tabular-nums font-medium">
              {loser.elo_rating} → {Math.max(100, loser.elo_rating - preview)} (-
              {preview})
            </span>
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!winnerId || !loserId}
      >
        Record Match
      </Button>
    </form>
  );
}
