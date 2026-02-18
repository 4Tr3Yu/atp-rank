import { createClient } from "@/lib/supabase/server";
import { RecordMatchForm } from "@/components/matches/record-match-form";
import { recordMatch } from "./actions";

export default async function RecordMatchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: players } = await supabase
    .from("profiles")
    .select("*")
    .order("elo_rating", { ascending: false });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Match</h1>
        <p className="text-muted-foreground">
          Log a match result to update rankings
        </p>
      </div>
      <RecordMatchForm
        players={players || []}
        currentUserId={user!.id}
        action={recordMatch}
      />
    </div>
  );
}
