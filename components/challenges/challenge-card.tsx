import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChallengeActions } from "./challenge-actions";
import type { Challenge, Profile } from "@/lib/types/database";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  declined: "bg-muted text-muted-foreground border-border",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ChallengeCard({
  challenge,
  challenger,
  challenged,
  currentUserId,
  respondAction,
  cancelAction,
}: {
  challenge: Challenge;
  challenger: Profile;
  challenged: Profile;
  currentUserId: string;
  respondAction: (formData: FormData) => Promise<void>;
  cancelAction: (formData: FormData) => Promise<void>;
}) {
  const isChallenger = currentUserId === challenge.challenger_id;
  const opponent = isChallenger ? challenged : challenger;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link
          href={`/player/${opponent.id}`}
          className="shrink-0 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(opponent.display_name || opponent.username)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {isChallenger ? "You challenged " : ""}
              <Link
                href={`/player/${opponent.id}`}
                className="hover:underline"
              >
                {opponent.display_name || opponent.username}
              </Link>
              {!isChallenger ? " challenged you" : ""}
            </p>
            <Badge variant="outline" className={statusColors[challenge.status]}>
              {challenge.status}
            </Badge>
          </div>
          {challenge.message && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              &ldquo;{challenge.message}&rdquo;
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {timeAgo(challenge.created_at)}
          </p>
        </div>
      </div>

      <ChallengeActions
        challenge={challenge}
        currentUserId={currentUserId}
        respondAction={respondAction}
        cancelAction={cancelAction}
      />
    </div>
  );
}
