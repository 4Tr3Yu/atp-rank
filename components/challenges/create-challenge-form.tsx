"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlayerSelect } from "@/components/shared/player-select";
import { useFormAction, useLoading } from "@/lib/loading-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MatchType, Profile } from "@/lib/types/database";

export function CreateChallengeForm({
  players,
  currentUserId,
  action,
}: {
  players: Profile[];
  currentUserId: string;
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [matchType, setMatchType] = useState<MatchType>("singles");
  const [challengedId, setChallengedId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [challengedPartnerId, setChallengedPartnerId] = useState("");
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

  const handleMatchTypeChange = (type: MatchType) => {
    setMatchType(type);
    setChallengedId("");
    setPartnerId("");
    setChallengedPartnerId("");
  };

  const selectedIds = [currentUserId, challengedId, partnerId, challengedPartnerId].filter(Boolean);

  const isSinglesReady = matchType === "singles" && challengedId;
  const isDoublesReady = matchType === "doubles" && challengedId && partnerId && challengedPartnerId;

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="challenger_id" value={currentUserId} />
      <input type="hidden" name="challenged_id" value={challengedId} />
      <input type="hidden" name="match_type" value={matchType} />
      {matchType === "doubles" && (
        <>
          <input type="hidden" name="challenger_partner_id" value={partnerId} />
          <input type="hidden" name="challenged_partner_id" value={challengedPartnerId} />
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
            value={challengedId}
            onSelect={setChallengedId}
            placeholder="Who do you want to challenge?"
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
              value={challengedId}
              onSelect={setChallengedId}
              placeholder="Select opponent..."
              excludeIds={selectedIds}
            />
          </div>
          <div className="space-y-2">
            <Label>Opponent 2</Label>
            <PlayerSelect
              players={players}
              value={challengedPartnerId}
              onSelect={setChallengedPartnerId}
              placeholder="Select opponent..."
              excludeIds={selectedIds}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Message (optional)</Label>
        <Textarea
          name="message"
          placeholder="Ready to get destroyed?"
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!(isSinglesReady || isDoublesReady) || isLoading}>
        {isLoading ? "Sending..." : "Send Challenge"}
      </Button>
    </form>
  );
}
