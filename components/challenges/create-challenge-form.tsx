"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlayerSelect } from "@/components/shared/player-select";
import { useFormAction, useLoading } from "@/lib/loading-context";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

export function CreateChallengeForm({
  players,
  currentUserId,
  action,
}: {
  players: Profile[];
  currentUserId: string;
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [challengedId, setChallengedId] = useState("");
  const { isLoading } = useLoading();
  const router = useRouter();

  const wrappedAction = useCallback(
    async (formData: FormData) => {
      const result = await action(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Challenge sent!");
      router.push("/challenges");
    },
    [action, router]
  );
  const handleSubmit = useFormAction(wrappedAction);

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
          placeholder="Ready to get destroyed?"
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!challengedId || isLoading}>
        {isLoading ? "Sending..." : "Send Challenge"}
      </Button>
    </form>
  );
}
