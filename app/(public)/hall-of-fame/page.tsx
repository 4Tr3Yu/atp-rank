import { createClient } from "@/lib/supabase/server";
import { HallOfFameCard } from "@/components/seasons/hall-of-fame-card";
import { Trophy } from "lucide-react";
import type { Profile, Season, SeasonWinner } from "@/lib/types/database";

export const metadata = {
  title: "Hall of Fame | ATP Rank",
  description: "Champions from past seasons",
};

type WinnerWithProfile = SeasonWinner & {
  profile: Pick<Profile, "id" | "username" | "display_name">;
};

export default async function HallOfFamePage() {
  const supabase = await createClient();

  // Fetch all completed seasons
  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "completed")
    .order("ends_at", { ascending: false });

  // Fetch all season winners with their profiles
  const { data: winners } = await supabase
    .from("season_winners")
    .select(`
      *,
      profile:profiles(id, username, display_name)
    `);

  // Group winners by season
  const winnersBySeason = new Map<string, WinnerWithProfile[]>();
  for (const winner of winners || []) {
    const seasonId = winner.season_id;
    if (!winnersBySeason.has(seasonId)) {
      winnersBySeason.set(seasonId, []);
    }
    winnersBySeason.get(seasonId)!.push(winner as WinnerWithProfile);
  }

  const hasCompletedSeasons = seasons && seasons.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold tracking-tight">Hall of Fame</h1>
        </div>
        <p className="text-muted-foreground">
          Champions from past seasons
        </p>
      </div>

      {hasCompletedSeasons ? (
        <div className="space-y-6">
          {(seasons as Season[]).map((season) => (
            <HallOfFameCard
              key={season.id}
              season={season}
              winners={winnersBySeason.get(season.id) || []}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground">
            No completed seasons yet
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Champions will be displayed here once the first season ends.
          </p>
        </div>
      )}
    </div>
  );
}
