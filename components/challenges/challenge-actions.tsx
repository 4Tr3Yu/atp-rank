"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFormAction } from "@/lib/loading-context";
import type { Challenge } from "@/lib/types/database";

export function ChallengeActions({
  challenge,
  currentUserId,
  respondAction,
  cancelAction,
  resolveAction,
}: {
  challenge: Challenge;
  currentUserId: string;
  respondAction: (formData: FormData) => Promise<void>;
  cancelAction: (formData: FormData) => Promise<void>;
  resolveAction?: (formData: FormData) => Promise<void>;
}) {
  const handleRespond = useFormAction(respondAction);
  const handleCancel = useFormAction(cancelAction);
  const handleResolve = useFormAction(resolveAction ?? respondAction);
  const isChallenger = currentUserId === challenge.challenger_id;
  const isChallenged = currentUserId === challenge.challenged_id;

  // Pending challenge — challenged user can accept/decline, challenger can cancel
  if (challenge.status === "pending") {
    if (isChallenged) {
      return (
        <div className="flex gap-2 shrink-0">
          <form action={handleRespond}>
            <input type="hidden" name="challenge_id" value={challenge.id} />
            <input type="hidden" name="response" value="accepted" />
            <Button size="sm" type="submit">
              Accept
            </Button>
          </form>
          <form action={handleRespond}>
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
        <form action={handleCancel} className="shrink-0">
          <input type="hidden" name="challenge_id" value={challenge.id} />
          <Button size="sm" variant="ghost" type="submit">
            Cancel
          </Button>
        </form>
      );
    }
  }

  // Accepted challenge with resolve action — show "I Won" / "I Lost" buttons
  if (challenge.status === "accepted" && resolveAction) {
    return (
      <div className="flex gap-2 shrink-0">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="default">
              I Won
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm your win?</AlertDialogTitle>
              <AlertDialogDescription>
                This will record the match result and update Elo ratings
                immediately. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <form action={handleResolve}>
                <input
                  type="hidden"
                  name="challenge_id"
                  value={challenge.id}
                />
                <input type="hidden" name="result" value="won" />
                <AlertDialogAction type="submit">
                  Confirm Win
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline">
              I Lost
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm your loss?</AlertDialogTitle>
              <AlertDialogDescription>
                This will record the match result and update Elo ratings
                immediately. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <form action={handleResolve}>
                <input
                  type="hidden"
                  name="challenge_id"
                  value={challenge.id}
                />
                <input type="hidden" name="result" value="lost" />
                <AlertDialogAction type="submit">
                  Confirm Loss
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Accepted without resolve action (spectator/public) — nothing to show
  if (challenge.status === "accepted") {
    return null;
  }

  // Expired — nothing to show
  if (challenge.status === "expired") {
    return null;
  }

  return null;
}
