"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlayerSelect } from "@/components/shared/player-select";
import { useFormAction } from "@/lib/loading-context";
import type { Profile } from "@/lib/types/database";

export function CreateChallengeForm({
  players,
  currentUserId,
  action,
}: {
  players: Profile[];
  currentUserId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [challengedId, setChallengedId] = useState("");
  const handleSubmit = useFormAction(action);

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="challenger_id" value={currentUserId} />
      <input type="hidden" name="challenged_id" value={challengedId} />

      <div className="space-y-2">
        <Label>Opponent</Label>
        <PlayerSelect
          players={players}
          value={challengedId}
          onSelect={setChallengedId}
          placeholder="Who do you want to challenge?"
          excludeId={currentUserId}
        />
      </div>

      <div className="space-y-2">
        <Label>Message (optional)</Label>
        <Textarea
          name="message"
          placeholder="Ready to get destroyed? 🎾"
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!challengedId}>
        Send Challenge
      </Button>
    </form>
  );
}
