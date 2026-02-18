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
import { Textarea } from "@/components/ui/textarea";
import { PlayerSelect } from "@/components/shared/player-select";
import type { Profile } from "@/lib/types/database";

function ChallengeFormContent({
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
  const [challengedId, setChallengedId] = useState("");
  const [pending, setPending] = useState(false);

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

      <Button
        type="submit"
        className="w-full"
        disabled={!challengedId || pending}
      >
        {pending ? "Sending..." : "Send Challenge"}
      </Button>
    </form>
  );
}

export function CreateChallengeModal({
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
            <DialogTitle>New Challenge</DialogTitle>
            <DialogDescription>
              Challenge a friend to a match
            </DialogDescription>
          </DialogHeader>
          <ChallengeFormContent
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
          <SheetTitle>New Challenge</SheetTitle>
          <SheetDescription>
            Challenge a friend to a match
          </SheetDescription>
        </SheetHeader>
        <ChallengeFormContent
          players={players}
          currentUserId={currentUserId}
          action={action}
          onSuccess={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
