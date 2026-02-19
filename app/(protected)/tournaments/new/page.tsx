import { createClient } from "@/lib/supabase/server";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { BackButton } from "@/components/shared/back-button";
import { createTournament } from "../actions";

export default async function NewTournamentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <BackButton />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create Tournament
        </h1>
        <p className="text-muted-foreground">
          Set up a single elimination bracket
        </p>
      </div>
      <TournamentForm
        currentUserId={user!.id}
        action={createTournament}
      />
    </div>
  );
}
