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

function playerName(profile: Profile) {
  return profile.display_name || profile.username;
}

function PlayerLink({ profile }: { profile: Profile }) {
  return (
    <Link href={`/player/${profile.id}`} className="hover:underline">
      {playerName(profile)}
    </Link>
  );
}

export function ChallengeCard({
  challenge,
  challenger,
  challenged,
  challengerPartner,
  challengedPartner,
  currentUserId,
  respondAction,
  cancelAction,
  resolveAction,
}: {
  challenge: Challenge;
  challenger: Profile;
  challenged: Profile;
  challengerPartner?: Profile | null;
  challengedPartner?: Profile | null;
  currentUserId?: string;
  respondAction: (formData: FormData) => Promise<void>;
  cancelAction: (formData: FormData) => Promise<void>;
  resolveAction?: (formData: FormData) => Promise<void>;
}) {
  const isDoubles = challenge.match_type === "doubles";
  const isParticipant = currentUserId != null;

  const isOnChallengerTeam = currentUserId === challenge.challenger_id ||
    currentUserId === challenge.challenger_partner_id;
  const isOnChallengedTeam = currentUserId === challenge.challenged_id ||
    currentUserId === challenge.challenged_partner_id;

  // For singles: first profile in "opponent" team
  const opponent = isParticipant
    ? isOnChallengerTeam
      ? challenged
      : challenger
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isParticipant ? (
          isDoubles ? (
            /* Doubles participant view */
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">
                  {isOnChallengerTeam ? (
                    <>
                      You & <PlayerLink profile={challengerPartner ?? challenger} />{" "}
                      <span className="text-muted-foreground">challenged</span>{" "}
                      <PlayerLink profile={challenged} /> & <PlayerLink profile={challengedPartner ?? challenged} />
                    </>
                  ) : (
                    <>
                      <PlayerLink profile={challenger} /> & <PlayerLink profile={challengerPartner ?? challenger} />{" "}
                      <span className="text-muted-foreground">challenged</span>{" "}
                      you & <PlayerLink profile={isOnChallengedTeam && currentUserId !== challenge.challenged_id ? challenged : (challengedPartner ?? challenged)} />
                    </>
                  )}
                </p>
                <Badge variant="outline" className={statusColors[challenge.status]}>
                  {challenge.status}
                </Badge>
                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  2v2
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
          ) : opponent ? (
            /* Singles participant view */
            <>
              <Link
                href={`/player/${opponent.id}`}
                className="shrink-0 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(playerName(opponent))}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {isOnChallengerTeam ? "You challenged " : ""}
                    <Link
                      href={`/player/${opponent.id}`}
                      className="hover:underline"
                    >
                      {playerName(opponent)}
                    </Link>
                    {!isOnChallengerTeam ? " challenged you" : ""}
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
          ) : null
        ) : (
          /* Public/spectator view */
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {isDoubles ? (
                  <>
                    <PlayerLink profile={challenger} /> & <PlayerLink profile={challengerPartner ?? challenger} />
                    <span className="text-muted-foreground mx-1.5">vs</span>
                    <PlayerLink profile={challenged} /> & <PlayerLink profile={challengedPartner ?? challenged} />
                  </>
                ) : (
                  <>
                    <PlayerLink profile={challenger} />
                    <span className="text-muted-foreground mx-1.5">vs</span>
                    <PlayerLink profile={challenged} />
                  </>
                )}
              </p>
              <Badge variant="outline" className={statusColors[challenge.status]}>
                {challenge.status}
              </Badge>
              {isDoubles && (
                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  2v2
                </Badge>
              )}
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
