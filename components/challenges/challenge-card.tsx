import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChallengeActions } from "./challenge-actions";
import { CountdownTimer } from "./countdown-timer";
import type { Challenge, Profile } from "@/lib/types/database";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  declined: "bg-muted text-muted-foreground border-border",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  expired: "bg-red-500/20 text-red-400 border-red-500/30",
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
  resolveAction,
}: {
  challenge: Challenge;
  challenger: Profile;
  challenged: Profile;
  currentUserId?: string;
  respondAction: (formData: FormData) => Promise<void>;
  cancelAction: (formData: FormData) => Promise<void>;
  resolveAction?: (formData: FormData) => Promise<void>;
}) {
  const isParticipant = currentUserId != null;
  const isChallenger = currentUserId === challenge.challenger_id;
  const opponent = isParticipant
    ? isChallenger
      ? challenged
      : challenger
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isParticipant && opponent ? (
          <>
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
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">
                  {timeAgo(challenge.created_at)}
                </p>
                {challenge.status === "accepted" && challenge.expires_at && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <CountdownTimer expiresAt={challenge.expires_at} />
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Public/spectator view: Challenger vs Challenged */
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                <Link
                  href={`/player/${challenger.id}`}
                  className="hover:underline"
                >
                  {challenger.display_name || challenger.username}
                </Link>
                <span className="text-muted-foreground mx-1.5">vs</span>
                <Link
                  href={`/player/${challenged.id}`}
                  className="hover:underline"
                >
                  {challenged.display_name || challenged.username}
                </Link>
              </p>
              <Badge variant="outline" className={statusColors[challenge.status]}>
                {challenge.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">
                {timeAgo(challenge.created_at)}
              </p>
              {challenge.status === "accepted" && challenge.expires_at && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <CountdownTimer expiresAt={challenge.expires_at} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {isParticipant && currentUserId && (
        <ChallengeActions
          challenge={challenge}
          currentUserId={currentUserId}
          respondAction={respondAction}
          cancelAction={cancelAction}
          resolveAction={resolveAction}
        />
      )}
    </div>
  );
}
