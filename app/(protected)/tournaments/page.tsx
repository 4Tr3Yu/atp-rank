import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { TournamentList } from "@/components/tournaments/tournament-list";

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
      <TournamentList
        tournaments={tournaments || []}
        participantCounts={countMap}
      />
    </div>
  );
}
