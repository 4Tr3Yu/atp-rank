import Link from "next/link";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/shared/back-button";
import { TournamentList } from "@/components/tournaments/tournament-list";
import { getPrizes } from "@/lib/tournament-prizes";

export default async function TournamentsPage() {
  const supabase = await createClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });

  // Get participant counts
  const { data: participants } = await supabase
    .from("tournament_participants")
    .select("tournament_id");

  const countMap = new Map<string, number>();
  for (const p of participants || []) {
    countMap.set(p.tournament_id, (countMap.get(p.tournament_id) || 0) + 1);
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground">
            Single elimination brackets
          </p>
        </div>
        <Button asChild>
          <Link href="/tournaments/new">Create Tournament</Link>
        </Button>
      </div>

      {/* Rewards Hero */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Earn Elo by competing</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Top finishers earn bonus Elo points. Bigger brackets, bigger rewards.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([4, 8, 16] as const).map((size) => {
            const prizes = getPrizes(size);
            return (
              <div
                key={size}
                className="rounded-xl border border-border bg-card p-3 space-y-2"
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  {size} players
                </p>
                {prizes.map((prize) => (
                  <div
                    key={prize.label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{prize.icon}</span>
                      <span className="font-medium">{prize.label}</span>
                    </span>
                    <span className="font-semibold text-green-400 tabular-nums">
                      +{prize.bonus}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <TournamentList
        tournaments={tournaments || []}
        participantCounts={countMap}
      />
    </div>
  );
}
