"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlayerSelect } from "@/components/shared/player-select";
import { useFormAction } from "@/lib/loading-context";
import type { MatchType, Profile } from "@/lib/types/database";

interface TournamentActionsProps {
  tournamentId: string;
  userId: string;
  matchType: MatchType;
  canJoin: boolean;
  canLeave: boolean;
  canStart: boolean;
  joinAction: (formData: FormData) => Promise<void>;
  leaveAction: (formData: FormData) => Promise<void>;
  startAction: (formData: FormData) => Promise<void>;
  players?: Profile[];
  existingPlayerIds?: string[];
}

export function TournamentActions({
  tournamentId,
  userId,
  matchType,
  canJoin,
  canLeave,
  canStart,
  joinAction,
  leaveAction,
  startAction,
  players,
  existingPlayerIds,
}: TournamentActionsProps) {
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const handleJoin = useFormAction(joinAction);
  const handleLeave = useFormAction(leaveAction);
  const handleStart = useFormAction(startAction);

  const isDoubles = matchType === "doubles";

  // For doubles, exclude self and players already in the tournament
  const excludeIds = [userId, ...(existingPlayerIds || [])];

  return (
    <div className="flex gap-2">
      {canJoin && !isDoubles && (
        <form action={handleJoin}>
          <input type="hidden" name="tournament_id" value={tournamentId} />
          <input type="hidden" name="player_id" value={userId} />
          <Button type="submit">Join</Button>
        </form>
      )}
      {canJoin && isDoubles && (
        <>
          <Button onClick={() => setShowPartnerDialog(true)}>
            Join with Partner
          </Button>
          <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Choose Your Partner</DialogTitle>
                <DialogDescription>
                  Select a partner to join as a team
                </DialogDescription>
              </DialogHeader>
              <form
                action={handleJoin}
                className="space-y-4"
                onSubmit={() => setShowPartnerDialog(false)}
              >
                <input type="hidden" name="tournament_id" value={tournamentId} />
                <input type="hidden" name="player_id" value={userId} />
                <input type="hidden" name="partner_id" value={partnerId} />
                <div className="space-y-2">
                  <Label>Partner</Label>
                  <PlayerSelect
                    players={players || []}
                    value={partnerId}
                    onSelect={setPartnerId}
                    placeholder="Select your partner..."
                    excludeIds={excludeIds}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!partnerId}>
                  Join Tournament
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </>
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
