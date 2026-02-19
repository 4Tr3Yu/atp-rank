"use client";

import { Button } from "@/components/ui/button";
import { useFormAction } from "@/lib/loading-context";
import type { Match } from "@/lib/types/database";

export function PendingMatchActions({
  match,
  confirmAction,
  declineAction,
}: {
  match: Match;
  confirmAction: (formData: FormData) => Promise<void>;
  declineAction: (formData: FormData) => Promise<void>;
}) {
  const handleConfirm = useFormAction(confirmAction);
  const handleDecline = useFormAction(declineAction);

  return (
    <div className="flex gap-2 shrink-0">
      <form action={handleConfirm}>
        <input type="hidden" name="match_id" value={match.id} />
        <Button size="sm" type="submit">
          Confirm
        </Button>
      </form>
      <form action={handleDecline}>
        <input type="hidden" name="match_id" value={match.id} />
        <Button size="sm" variant="outline" type="submit">
          Decline
        </Button>
      </form>
    </div>
  );
}
