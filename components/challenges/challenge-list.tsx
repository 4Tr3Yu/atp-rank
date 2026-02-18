import { ChallengeCard } from "./challenge-card";
import type { Challenge, Profile } from "@/lib/types/database";

export function ChallengeList({
  challenges,
  profiles,
  currentUserId,
  respondAction,
  cancelAction,
}: {
  challenges: Challenge[];
  profiles: Map<string, Profile>;
  currentUserId: string;
  respondAction: (formData: FormData) => Promise<void>;
  cancelAction: (formData: FormData) => Promise<void>;
}) {
  if (challenges.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No challenges here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {challenges.map((challenge) => {
        const challenger = profiles.get(challenge.challenger_id);
        const challenged = profiles.get(challenge.challenged_id);
        if (!challenger || !challenged) return null;

        return (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            challenger={challenger}
            challenged={challenged}
            currentUserId={currentUserId}
            respondAction={respondAction}
            cancelAction={cancelAction}
          />
        );
      })}
    </div>
  );
}
