"use client";

import { Button } from "@/components/ui/button";
import { useFormAction } from "@/lib/loading-context";

interface TournamentActionsProps {
  tournamentId: string;
  userId: string;
  canJoin: boolean;
  canLeave: boolean;
  canStart: boolean;
  joinAction: (formData: FormData) => Promise<void>;
  leaveAction: (formData: FormData) => Promise<void>;
  startAction: (formData: FormData) => Promise<void>;
}

export function TournamentActions({
  tournamentId,
  userId,
  canJoin,
  canLeave,
  canStart,
  joinAction,
  leaveAction,
  startAction,
}: TournamentActionsProps) {
  const handleJoin = useFormAction(joinAction);
  const handleLeave = useFormAction(leaveAction);
  const handleStart = useFormAction(startAction);

  return (
    <div className="flex gap-2">
      {canJoin && (
        <form action={handleJoin}>
          <input type="hidden" name="tournament_id" value={tournamentId} />
          <input type="hidden" name="player_id" value={userId} />
          <Button type="submit">Join</Button>
        </form>
      )}
      {canLeave && (
        <form action={handleLeave}>
          <input type="hidden" name="tournament_id" value={tournamentId} />
          <input type="hidden" name="player_id" value={userId} />
          <Button type="submit" variant="outline">
            Leave
          </Button>
        </form>
      )}
      {canStart && (
        <form action={handleStart}>
          <input type="hidden" name="tournament_id" value={tournamentId} />
          <Button type="submit">Start Tournament</Button>
        </form>
      )}
    </div>
  );
}
