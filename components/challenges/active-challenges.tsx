import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { zenDots } from "@/lib/fonts";
import { CountdownTimer } from "./countdown-timer";
import { createClient } from "@/lib/supabase/server";
import { resolveExpiredChallenges } from "@/lib/challenges";
import type { Profile } from "@/lib/types/database";

function playerName(p: Profile) {
  return p.display_name || p.username;
}

export async function ActiveChallenges() {
  // Lazy expiration: resolve any expired challenges before fetching
  await resolveExpiredChallenges();

  const supabase = await createClient();

  // Fetch both pending and accepted challenges (including doubles fields)
  const { data: allChallenges } = await supabase
    .from("challenges")
    .select("id, challenger_id, challenged_id, challenger_partner_id, challenged_partner_id, match_type, expires_at, created_at, status, message")
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

  // Collect unique player IDs (including partners)
  const playerIds = new Set<string>();
  for (const c of allChallenges || []) {
    playerIds.add(c.challenger_id);
    playerIds.add(c.challenged_id);
    if (c.challenger_partner_id) playerIds.add(c.challenger_partner_id);
    if (c.challenged_partner_id) playerIds.add(c.challenged_partner_id);
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

              const isDoubles = challenge.match_type === "doubles";
              const challengerPartner = challenge.challenger_partner_id
                ? profileMap.get(challenge.challenger_partner_id)
                : null;
              const challengedPartner = challenge.challenged_partner_id
                ? profileMap.get(challenge.challenged_partner_id)
                : null;

              return (
                <div
                  key={challenge.id}
                  className="rounded-xl border border-yellow-500/20 bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      <Link
                        href={`/player/${challenger.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {playerName(challenger)}
                      </Link>
                      {isDoubles && challengerPartner && (
                        <>
                          {" & "}
                          <Link
                            href={`/player/${challengerPartner.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {playerName(challengerPartner)}
                          </Link>
                        </>
                      )}
                      {" challenged "}
                      <Link
                        href={`/player/${challenged.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {playerName(challenged)}
                      </Link>
                      {isDoubles && challengedPartner && (
                        <>
                          {" & "}
                          <Link
                            href={`/player/${challengedPartner.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {playerName(challengedPartner)}
                          </Link>
                        </>
                      )}
                    </p>
                    {isDoubles && (
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 shrink-0">
                        2v2
                      </Badge>
                    )}
                  </div>
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

              const isDoubles = challenge.match_type === "doubles";
              const challengerPartner = challenge.challenger_partner_id
                ? profileMap.get(challenge.challenger_partner_id)
                : null;
              const challengedPartner = challenge.challenged_partner_id
                ? profileMap.get(challenge.challenged_partner_id)
                : null;

              return (
                <div
                  key={challenge.id}
                  className={`relative rounded-xl border border-border bg-card p-4 overflow-hidden ${zenDots.className}`}
                >
                  {/* Gradient: transparent → orange center → transparent */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/15 to-transparent pointer-events-none" />

                  {isDoubles && (
                    <div className="relative z-10 mb-2 text-center">
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        2v2 Doubles
                      </Badge>
                    </div>
                  )}

                  {/* Challenger Team */}
                  <div className="relative z-10 text-center">
                    <Link
                      href={`/player/${challenger.id}`}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <p className="text-base font-medium truncate inline">
                        {playerName(challenger)}
                      </p>
                    </Link>
                    {isDoubles && challengerPartner && (
                      <>
                        <span className="text-muted-foreground mx-1">&</span>
                        <Link
                          href={`/player/${challengerPartner.id}`}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <p className="text-base font-medium truncate inline">
                            {playerName(challengerPartner)}
                          </p>
                        </Link>
                      </>
                    )}
                    <p className="text-[11px] text-orange-400 tabular-nums">
                      {isDoubles && challengerPartner
                        ? `${challenger.elo_rating + challengerPartner.elo_rating} Team Elo`
                        : `${challenger.elo_rating} Elo`
                      }
                    </p>
                  </div>

                  {/* VS */}
                  <p className="relative z-10 text-2xl text-center my-2 drop-shadow-lg">
                    VS
                  </p>

                  {/* Challenged Team */}
                  <div className="relative z-10 text-center">
                    <Link
                      href={`/player/${challenged.id}`}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <p className="text-base font-medium truncate inline">
                        {playerName(challenged)}
                      </p>
                    </Link>
                    {isDoubles && challengedPartner && (
                      <>
                        <span className="text-muted-foreground mx-1">&</span>
                        <Link
                          href={`/player/${challengedPartner.id}`}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <p className="text-base font-medium truncate inline">
                            {playerName(challengedPartner)}
                          </p>
                        </Link>
                      </>
                    )}
                    <p className="text-[11px] text-blue-400 tabular-nums">
                      {isDoubles && challengedPartner
                        ? `${challenged.elo_rating + challengedPartner.elo_rating} Team Elo`
                        : `${challenged.elo_rating} Elo`
                      }
                    </p>
                  </div>

                  {/* Timer */}
                  {challenge.expires_at && (
                    <div className="relative z-10 mt-3 pt-3 border-t border-border text-center">
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
