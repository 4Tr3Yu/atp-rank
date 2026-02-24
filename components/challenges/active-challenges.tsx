import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CountdownTimer } from "./countdown-timer";
import { createClient } from "@/lib/supabase/server";
import { resolveExpiredChallenges } from "@/lib/challenges";
import type { Profile } from "@/lib/types/database";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export async function ActiveChallenges() {
  // Lazy expiration: resolve any expired challenges before fetching
  await resolveExpiredChallenges();

  const supabase = await createClient();

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, challenger_id, challenged_id, expires_at, created_at")
    .eq("status", "accepted")
    .order("expires_at", { ascending: true });

  if (!challenges || challenges.length === 0) return null;

  // Collect unique player IDs
  const playerIds = new Set<string>();
  for (const c of challenges) {
    playerIds.add(c.challenger_id);
    playerIds.add(c.challenged_id);
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", [...playerIds]);

  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Active Challenges</h2>
        <Link
          href="/challenges"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {challenges.map((challenge) => {
          const challenger = profileMap.get(challenge.challenger_id);
          const challenged = profileMap.get(challenge.challenged_id);
          if (!challenger || !challenged) return null;

          return (
            <div
              key={challenge.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              {/* Challenger */}
              <Link
                href={`/player/${challenger.id}`}
                className="shrink-0 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {getInitials(
                      challenger.display_name || challenger.username
                    )}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0 text-center">
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
                {challenge.expires_at && (
                  <CountdownTimer expiresAt={challenge.expires_at} />
                )}
              </div>

              {/* Challenged */}
              <Link
                href={`/player/${challenged.id}`}
                className="shrink-0 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {getInitials(
                      challenged.display_name || challenged.username
                    )}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
