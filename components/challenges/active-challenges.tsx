import Link from "next/link";
import { zenDots } from "@/lib/fonts";
import { CountdownTimer } from "./countdown-timer";
import { createClient } from "@/lib/supabase/server";
import { resolveExpiredChallenges } from "@/lib/challenges";
import type { Profile } from "@/lib/types/database";

export async function ActiveChallenges() {
  // Lazy expiration: resolve any expired challenges before fetching
  await resolveExpiredChallenges();

  const supabase = await createClient();

  // Fetch both pending and accepted challenges
  const { data: allChallenges } = await supabase
    .from("challenges")
    .select("id, challenger_id, challenged_id, expires_at, created_at, status, message")
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  const pending = (allChallenges || []).filter((c) => c.status === "pending");
  const active = (allChallenges || []).filter((c) => c.status === "accepted");

  if (pending.length === 0 && active.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-3">Challenges</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No challenges right now.
        </div>
      </div>
    );
  }

  // Collect unique player IDs
  const playerIds = new Set<string>();
  for (const c of allChallenges || []) {
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
    <div className="space-y-6">
      {/* Pending Challenges */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Thrown Gauntlets</h2>
          <div className="space-y-3">
            {pending.map((challenge) => {
              const challenger = profileMap.get(challenge.challenger_id);
              const challenged = profileMap.get(challenge.challenged_id);
              if (!challenger || !challenged) return null;

              return (
                <div
                  key={challenge.id}
                  className="rounded-xl border border-yellow-500/20 bg-card p-4"
                >
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href={`/player/${challenger.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {challenger.display_name || challenger.username}
                    </Link>
                    {" challenged "}
                    <Link
                      href={`/player/${challenged.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {challenged.display_name || challenged.username}
                    </Link>
                  </p>
                  {challenge.message && (
                    <p className="mt-2 text-sm italic text-orange-400/90">
                      &ldquo;{challenge.message}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Challenges */}
      {active.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Active Matches</h2>
          <div className="space-y-3">
            {active.map((challenge) => {
              const challenger = profileMap.get(challenge.challenger_id);
              const challenged = profileMap.get(challenge.challenged_id);
              if (!challenger || !challenged) return null;

              return (
                <div
                  key={challenge.id}
                  className={`relative rounded-xl border border-border bg-card p-4 overflow-hidden ${zenDots.className}`}
                >
                  {/* Gradient: transparent → orange center → transparent */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/15 to-transparent pointer-events-none" />
                  {/* Challenger */}
                  <Link
                    href={`/player/${challenger.id}`}
                    className="block text-center hover:opacity-80 transition-opacity"
                  >
                    <p className="text-base font-medium truncate">
                      {challenger.display_name || challenger.username}
                    </p>
                    <p className="text-[11px] text-orange-400 tabular-nums">
                      {challenger.elo_rating} Elo
                    </p>
                  </Link>

                  {/* VS */}
                  <p className="text-2xl text-center my-2 drop-shadow-lg">
                    VS
                  </p>

                  {/* Challenged */}
                  <Link
                    href={`/player/${challenged.id}`}
                    className="block text-center hover:opacity-80 transition-opacity"
                  >
                    <p className="text-base font-medium truncate">
                      {challenged.display_name || challenged.username}
                    </p>
                    <p className="text-[11px] text-blue-400 tabular-nums">
                      {challenged.elo_rating} Elo
                    </p>
                  </Link>

                  {/* Timer */}
                  {challenge.expires_at && (
                    <div className="mt-3 pt-3 border-t border-border text-center">
                      <CountdownTimer expiresAt={challenge.expires_at} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Link
        href="/challenges"
        className="block text-sm text-primary hover:underline text-center"
      >
        View all
      </Link>
    </div>
  );
}
