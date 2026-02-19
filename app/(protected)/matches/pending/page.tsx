import { createClient } from "@/lib/supabase/server";
import { PendingMatchList } from "@/components/matches/pending-match-list";
import { BackButton } from "@/components/shared/back-button";
import { confirmMatch, declineMatch } from "./actions";
import type { Profile } from "@/lib/types/database";

export default async function PendingMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  // Fetch pending matches where user is involved but didn't record
  const { data: pendingMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "pending")
    .or(`winner_id.eq.${userId},loser_id.eq.${userId}`)
    .neq("recorded_by", userId)
    .order("played_at", { ascending: false });

  // Profile map
  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Matches</h1>
        <p className="text-muted-foreground">
          Confirm match results recorded by others
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <PendingMatchList
        matches={pendingMatches || []}
        profiles={profileMap}
        currentUserId={userId}
        confirmAction={confirmMatch}
        declineAction={declineMatch}
      />
    </div>
  );
}
