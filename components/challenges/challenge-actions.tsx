"use client";

import { Button } from "@/components/ui/button";
import type { Challenge } from "@/lib/types/database";

export function ChallengeActions({
  challenge,
  currentUserId,
  respondAction,
  cancelAction,
}: {
  challenge: Challenge;
  currentUserId: string;
  respondAction: (formData: FormData) => Promise<void>;
  cancelAction: (formData: FormData) => Promise<void>;
}) {
  const isChallenger = currentUserId === challenge.challenger_id;
  const isChallenged = currentUserId === challenge.challenged_id;

  // Pending challenge — challenged user can accept/decline, challenger can cancel
  if (challenge.status === "pending") {
    if (isChallenged) {
      return (
        <div className="flex gap-2 shrink-0">
          <form action={respondAction}>
            <input type="hidden" name="challenge_id" value={challenge.id} />
            <input type="hidden" name="response" value="accepted" />
            <Button size="sm" type="submit">
              Accept
            </Button>
          </form>
          <form action={respondAction}>
            <input type="hidden" name="challenge_id" value={challenge.id} />
            <input type="hidden" name="response" value="declined" />
            <Button size="sm" variant="outline" type="submit">
              Decline
            </Button>
          </form>
        </div>
      );
    }

    if (isChallenger) {
      return (
        <form action={cancelAction} className="shrink-0">
          <input type="hidden" name="challenge_id" value={challenge.id} />
          <Button size="sm" variant="ghost" type="submit">
            Cancel
          </Button>
        </form>
      );
    }
  }

  // Accepted challenge — show "Record Result" hint
  if (challenge.status === "accepted") {
    return (
      <span className="text-xs text-muted-foreground shrink-0">
        Ready to play — record the match when done
      </span>
    );
  }

  return null;
}
